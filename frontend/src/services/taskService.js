const API_URL = 'https://kauanpains.pythonanywhere.com';

export const getTasks = () => {
  return fetch(`${API_URL}/tasks`).then((res) => res.json());
};

export const createTask = ({ title, priority, category, due_date }) => {
  return fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, priority, category, due_date }),
  });
};

export const toggleTaskStatus = (id) => {
  return fetch(`${API_URL}/tasks/${id}`, { method: 'PUT' });
};

export const deleteTaskById = (id) => {
  return fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
};

export const clearCompletedTasks = () => {
  return fetch(`${API_URL}/tasks/clear-completed`, { method: 'DELETE' });
};

export const updateTaskTitle = (id, title) => {
  return fetch(`${API_URL}/tasks/${id}/edit`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
};

