// 'React' dihapus karena tidak diperlukan untuk JSX transform baru (React 17+)
import './index.css';
// 'render' diganti dengan 'createRoot' dari 'react-dom/client' (React 18)
import { createRoot } from 'react-dom/client'; 
import { AppRouter } from './AppRouter';
import '@mantine/core/styles.css';

// Menggunakan sintaks API createRoot (React 18)
const container = document.getElementById('root');
// '!' digunakan untuk memberi tahu TypeScript bahwa 'container' tidak akan null
const root = createRoot(container!); 
root.render(<AppRouter />);