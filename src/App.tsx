import "./App.css";
import Canvas from "./lib/components/Canvas";
import NoiseMap from "./lib/components/Noise";

function App() {
  return <NoiseMap height={400} width={400} scale={3} />;
}

export default App;
