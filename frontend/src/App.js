import React, { useState, useEffect } from 'react';

function App() {
  // --- ESTADOS ---
  const [tasks, setTasks] = useState([]);
  const [menuAtivo, setMenuAtivo] = useState("dashboard");
  const [novoTitulo, setNovoTitulo] = useState("");
  const [prioridade, setPrioridade] = useState("Média");
  const [categoria, setCategoria] = useState("Pessoal");
  const [due_date, setDueDate] = useState("");
  const [busca, setBusca] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // --- CONTROLE DE MODO ESCURO ---
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [darkMode]);

  // --- CARREGAR DADOS ---
  const carregarTarefas = () => {
    fetch('http://127.0.0.1:5000/tasks')
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error("Erro ao conectar com o servidor:", err));
  };

  useEffect(() => {
    carregarTarefas();
  }, []);

  // --- FUNÇÕES DA API ---
  const addTask = () => {
    if (!novoTitulo.trim()) return;
    fetch('http://127.0.0.1:5000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: novoTitulo,
        priority: prioridade,
        category: categoria,
        due_date: due_date
      })
    }).then(() => {
      setNovoTitulo("");
      setDueDate("");
      carregarTarefas();
    });
  };

  const toggleTask = (id) => {
    fetch(`http://127.0.0.1:5000/tasks/${id}`, { method: 'PUT' })
      .then(() => carregarTarefas());
  };

  const deleteTask = (id) => {
    fetch(`http://127.0.0.1:5000/tasks/${id}`, { method: 'DELETE' })
      .then(() => carregarTarefas());
  };

  const clearCompleted = () => {
    fetch('http://127.0.0.1:5000/tasks/clear-completed', { method: 'DELETE' })
      .then(() => carregarTarefas());
  };

  // --- FILTRAGEM ---
  const tarefasFiltradas = tasks.filter(t =>
    t.title.toLowerCase().includes(busca.toLowerCase())
  );

  const concluidas = tasks.filter(t => t.status === 'concluída').length;
  const progresso = tasks.length > 0 ? Math.round((concluidas / tasks.length) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-sans">

      {/* --- SIDEBAR (MENU LATERAL) --- */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-6 fixed h-full shadow-2xl z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">P</div>
          <span className="font-black text-slate-800 dark:text-white text-xl">PowerOS</span>
        </div>

        <nav className="flex-1 space-y-3">
          <button onClick={() => setMenuAtivo('dashboard')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${menuAtivo === 'dashboard' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <span>📊</span> Dashboard
          </button>
          <button onClick={() => setMenuAtivo('calendario')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${menuAtivo === 'calendario' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <span>📅</span> Prazos Ativos
          </button>
          <button onClick={() => setMenuAtivo('config')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${menuAtivo === 'config' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <span>⚙️</span> Configurações
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => setDarkMode(!darkMode)} className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-black dark:text-white uppercase tracking-widest active:scale-95 transition-all">
            {darkMode ? "☀️ Modo Claro" : "🌙 Modo Escuro"}
          </button>
        </div>
      </aside>

      {/* --- ÁREA DE CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 ml-64 p-12">

        {/* PÁGINA DASHBOARD */}
        {menuAtivo === 'dashboard' && (
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Cabeçalho de Estatísticas */}
            <div className="flex justify-between items-end bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
              <div className="flex-1">
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">Dashboard Principal</h2>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full transition-all duration-1000" style={{ width: `${progresso}%` }}></div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Progresso Geral: {progresso}%</p>
              </div>
              <button onClick={clearCompleted} className="ml-10 bg-rose-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-600 transition-all active:scale-95">Limpar Concluídos</button>
            </div>

            {/* Form de Criação Expandido */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 space-y-5">
              <div className="flex gap-4">
                <input
                  className="flex-1 bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all shadow-inner text-lg"
                  placeholder="O que precisa ser feito?"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <button onClick={addTask} className="bg-indigo-600 text-white w-20 rounded-2xl font-black text-3xl shadow-lg hover:bg-indigo-700 active:scale-90">+</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)} className="bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-xs font-bold outline-none">
                  <option>Baixa</option><option>Média</option><option>Alta</option>
                </select>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-xs font-bold outline-none">
                  <option>Pessoal</option><option>Trabalho</option><option>Estudo</option><option>Saúde</option>
                </select>
                <input type="date" value={due_date} onChange={(e) => setDueDate(e.target.value)} className="bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-xs font-bold outline-none" />
              </div>

              <input
                placeholder="🔍 Pesquisar na sua lista..."
                className="w-full bg-transparent border-b-2 border-slate-100 dark:border-slate-800 py-2 text-sm dark:text-white outline-none focus:border-indigo-500"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            {/* Listagem de Tarefas com Estilo de Prioridade */}
            <ul className="space-y-4">
              {tarefasFiltradas.map(task => (
                <li key={task.id} className={`group flex items-center justify-between p-6 rounded-[2rem] bg-white dark:bg-slate-900 border-l-[10px] shadow-sm transition-all hover:translate-x-2 ${
                  task.priority === 'Alta' ? 'border-l-rose-500' : (task.priority === 'Média' ? 'border-l-amber-400' : 'border-l-sky-400')
                } border dark:border-slate-800`}>
                  <div className="flex items-center gap-5 cursor-pointer flex-1" onClick={() => toggleTask(task.id)}>
                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${task.status === 'concluída' ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200' : 'bg-transparent border-slate-200 dark:border-slate-700'}`}>
                      {task.status === 'concluída' && <span className="text-white font-bold">✓</span>}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-lg font-bold dark:text-slate-100 ${task.status === 'concluída' ? 'line-through opacity-30 text-slate-500' : ''}`}>{task.title}</span>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 px-3 py-1 rounded-full uppercase"># {task.category}</span>
                        {task.due_date && <span className="text-[10px] font-black bg-rose-50 dark:bg-rose-900/30 text-rose-500 px-3 py-1 rounded-full uppercase tracking-tighter">⏰ {task.due_date}</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="w-12 h-12 flex items-center justify-center text-slate-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">🗑️</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* OUTRAS PÁGINAS (CALENDARIO E CONFIG) */}
        {menuAtivo === 'calendario' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-6">Próximos Prazos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.filter(t => t.due_date).map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-rose-500 font-bold text-xs uppercase mb-2">📅 {t.due_date}</p>
                  <h3 className="font-bold text-lg dark:text-white">{t.title}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {menuAtivo === 'config' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl text-center border dark:border-slate-800">
            <h2 className="text-3xl font-black dark:text-white mb-4">Painel de Controle</h2>
            <p className="text-slate-400 mb-10">Aqui você poderá gerenciar integrações e backups no futuro.</p>
            <div className="space-y-4">
               <div className="flex justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl items-center">
                  <span className="font-bold dark:text-white">Idioma do Sistema</span>
                  <span className="text-indigo-500 font-black">Português (BR)</span>
               </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;