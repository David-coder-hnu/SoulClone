import HeroSection from '../components/home/HeroSection'
import NeuralWeaving from '../components/home/NeuralWeaving'
import ProtocolMatrix from '../components/home/ProtocolMatrix'
import NeonTheater from '../components/home/NeonTheater'
import EchoesInTheDark from '../components/home/EchoesInTheDark'

export default function Home() {
  return (
    <div className="relative">
      <HeroSection />
      <NeuralWeaving />
      <ProtocolMatrix />
      <NeonTheater />
      <EchoesInTheDark />
    </div>
  )
}
