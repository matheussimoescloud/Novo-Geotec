import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/auth/AuthGuard';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ListagemApontamentos } from './pages/apontamentos/Listagem';
import { NovoApontamento } from './pages/apontamentos/Novo';
import { ListagemPreventivas } from './pages/preventivas/Listagem';
import { NovaPreventiva } from './pages/preventivas/Novo';
import { ListagemEquipamentos } from './pages/equipamentos/Listagem';
import { FormEquipamento } from './pages/equipamentos/Formulario';
import { ListagemUsuarios } from './pages/usuarios/Listagem';
import { EditUsuario } from './pages/usuarios/Formulario';
import { RelatoriosLogs } from './pages/relatorios/RelatoriosLogs';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas */}
        <Route element={<AuthGuard />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/apontamentos" element={<ListagemApontamentos />} />
            <Route path="/apontamentos/novo" element={<NovoApontamento />} />
            <Route path="/preventivas" element={<ListagemPreventivas />} />
            <Route path="/preventivas/novo" element={<NovaPreventiva />} />
            <Route path="/equipamentos" element={<ListagemEquipamentos />} />
            <Route path="/equipamentos/novo" element={<FormEquipamento />} />
            <Route path="/equipamentos/:id/editar" element={<FormEquipamento />} />
            <Route path="/usuarios" element={<ListagemUsuarios />} />
            <Route path="/usuarios/:id/editar" element={<EditUsuario />} />
            <Route path="/relatorios" element={<RelatoriosLogs />} />
            {/* Adicionar mais rotas aqui */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
