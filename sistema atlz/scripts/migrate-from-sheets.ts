import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as dotenv from 'dotenv';

// Carrega variáveis do .env ou .env.local na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// IMPORTANTE: Para rodar este script em Node sem estar logado no front, 
// é altamente recomendado usar a SERVICE_ROLE_KEY do Supabase para ignorar RLS.
// Se não tiver, tentará usar a chave Anônima (que pode ser bloqueada pelo RLS dependendo das policies).
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERRO: Supabase URL ou Key não encontrados no .env.local.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_DIR = path.resolve(__dirname, 'data');

async function migrate() {
    console.log("🚀 Iniciando migração de dados do SGPREV...");

    // 1. Verificar se pasta data/ existe
    if (!fs.existsSync(DATA_DIR)) {
        console.error(`❌ Pasta de dados não encontrada: ${DATA_DIR}`);
        console.error("Crie a pasta 'scripts/data' e coloque os arquivos 'patrimonios.csv', 'apontamentos.csv' e 'preventivas.csv' dentro dela.");
        process.exit(1);
    }

    // --- 1. MIGRAR PATRIMÔNIOS ---
    try {
        const pPath = path.join(DATA_DIR, 'patrimonios.csv');
        if (fs.existsSync(pPath)) {
            console.log("📦 Lendo patrimonios.csv...");
            const fileContent = fs.readFileSync(pPath, 'utf8');
            const records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });

            console.log(`Encontrados ${records.length} patrimônios. Inserindo no Supabase...`);
            for (const rec of records) {
                // Mapear colunas do CSV para o Banco (ajuste as chaves do objeto rec dependendo dos cabeçalhos do CSV do cliente)
                const { error } = await supabase.from('patrimonios').upsert({
                    patrimonio: rec.patrimonio || rec.Patrimonio || rec.PATRIMONIO,
                    departamento: rec.departamento || rec.Departamento || rec.DEPARTAMENTO || 'G1',
                    status: rec.status || rec.Status || rec.STATUS || 'ATIVO',
                    modelo: rec.modelo || rec.Modelo || rec.MODELO,
                    md_prev: rec.md_prev || rec.MD_Prev || rec.MD_PREV || 'MD.01',
                    grupo: rec.grupo || rec.Grupo || rec.GRUPO,
                }, { onConflict: 'patrimonio' });

                if (error) {
                    console.error(`⚠️ Erro ao inserir patrimônio ${rec.patrimonio}:`, error.message);
                }
            }
            console.log("✅ Patrimônios migrados com sucesso!");
        } else {
            console.log("⚠️ Arquivo patrimonios.csv não encontrado. Pulando...");
        }
    } catch (err) {
        console.error("❌ Erro fatal nos Patrimônios:", err);
    }

    // Obter mapa de Patrimônios para uso nos próximos arquivos
    const { data: dbPatrimonios, error: dbErr } = await supabase.from('patrimonios').select('id, patrimonio, departamento, grupo');
    if (dbErr) throw dbErr;

    const mapPatrimonios = new Map();
    dbPatrimonios.forEach(p => mapPatrimonios.set(p.patrimonio, p));

    // --- 2. MIGRAR APONTAMENTOS ---
    try {
        const aPath = path.join(DATA_DIR, 'apontamentos.csv');
        if (fs.existsSync(aPath)) {
            console.log("⏳ Lendo apontamentos.csv...");
            const fileContent = fs.readFileSync(aPath, 'utf8');
            const records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });

            console.log(`Encontrados ${records.length} apontamentos. Inserindo (em chunks de 50)...`);

            const inserts = [];
            for (const rec of records) {
                const numPat = rec.patrimonio || rec.Patrimonio || rec.PATRIMONIO;
                const eq = mapPatrimonios.get(numPat);

                if (!eq) {
                    console.warn(`⚠️ Equipamento ${numPat} não cadastrado. Pulando apontamento...`);
                    continue;
                }

                // Conversão segura de dados CSV
                let dataStr = rec.data || rec.Data || rec.DATA;
                // Tentar converter DD/MM/YYYY para YYYY-MM-DD se necessário
                if (dataStr && dataStr.includes('/')) {
                    const [d, m, y] = dataStr.split('/');
                    if (y && y.length === 4) dataStr = `${y}-${m}-${d}`;
                }

                const hrKmRaw = (rec.hr_km || rec.medicao_h_km || rec.Hr_Km || rec.Medicao || '0').replace(',', '.');
                const tpRaw = (rec.tp_hr_km || rec.tipo_h_km || rec.Tipo || 'HR').toUpperCase();

                inserts.push({
                    equipamento_id: eq.id,
                    data: dataStr || new Date().toISOString(),
                    tp_hr_km: tpRaw.includes('KM') ? 'KM' : 'HR',
                    hr_km: parseFloat(hrKmRaw),
                    os: rec.os || rec.id_os || rec.OS,
                    tecnico: rec.tecnico || rec.nome_tecnico || rec.Tecnico || 'Migração',
                    status: rec.status || rec.Status || rec.STATUS || 'FINALIZADO',
                });
            }

            // Inserir de 50 em 50 para não sobrecarregar
            const chunkSize = 50;
            for (let i = 0; i < inserts.length; i += chunkSize) {
                const chunk = inserts.slice(i, i + chunkSize);
                const { error } = await supabase.from('apontamentos').insert(chunk);
                if (error) console.error(`⚠️ Erro inserindo chunk apontamentos ${i}:`, error.message);
            }
            console.log("✅ Apontamentos migrados com sucesso!");
        } else {
            console.log("⚠️ Arquivo apontamentos.csv não encontrado. Pulando...");
        }
    } catch (err) {
        console.error("❌ Erro fatal nos Apontamentos:", err);
    }

    // --- 3. MIGRAR PREVENTIVAS ---
    try {
        const prevPath = path.join(DATA_DIR, 'preventivas.csv');
        if (fs.existsSync(prevPath)) {
            console.log("🛠️ Lendo preventivas.csv...");
            const fileContent = fs.readFileSync(prevPath, 'utf8');
            const records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });

            console.log(`Encontradas ${records.length} preventivas...`);
            const inserts = [];
            for (const rec of records) {
                const numPat = rec.patrimonio || rec.Patrimonio || rec.PATRIMONIO;
                const eq = mapPatrimonios.get(numPat);

                if (!eq) {
                    console.warn(`⚠️ Equipamento ${numPat} não cadastrado. Pulando preventiva...`);
                    continue;
                }

                let dataStr = rec.data || rec.data_realizacao || rec.Data || rec.DATA;
                if (dataStr && dataStr.includes('/')) {
                    const [d, m, y] = dataStr.split('/');
                    if (y && y.length === 4) dataStr = `${y}-${m}-${d}`;
                }

                const hrKmRaw = (rec.hr_km || rec.medicao_h_km || rec.Hr_Km || '0').replace(',', '.');

                inserts.push({
                    patrimonio_id: eq.id,
                    departamento: eq.departamento,
                    grupo: eq.grupo,
                    tipo_prev: rec.tipo_prev || rec.Tipo_Prev || rec.TIPO_PREV || 'Nv.01',
                    hr_km: parseFloat(hrKmRaw),
                    data_realizacao: dataStr || new Date().toISOString(),
                    cod: rec.cod || rec.Cod || rec.COD || 'NRM',
                    obs: rec.obs || rec.Obs || rec.OBS || 'Importado via script',
                });
            }

            const chunkSize = 50;
            for (let i = 0; i < inserts.length; i += chunkSize) {
                const chunk = inserts.slice(i, i + chunkSize);
                const { error } = await supabase.from('preventivas').insert(chunk);
                if (error) console.error(`⚠️ Erro inserindo chunk preventivas ${i}:`, error.message);
            }
            console.log("✅ Preventivas migradas com sucesso!");
        } else {
            console.log("⚠️ Arquivo preventivas.csv não encontrado. Pulando...");
        }
    } catch (err) {
        console.error("❌ Erro fatal nas Preventivas:", err);
    }

    console.log("🎉 Migração finalizada!");
}

migrate();
