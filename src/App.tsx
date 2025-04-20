import { ThemeProvider } from './context/ThemeContext';
import WritingInterface from './components/WritingInterface2';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col transition-colors duration-300">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <WritingInterface />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;