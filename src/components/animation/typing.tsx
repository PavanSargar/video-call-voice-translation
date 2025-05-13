import { TypeAnimation } from "react-type-animation";

export default function Typing() {
  return (
    <TypeAnimation
      cursor={true}
      sequence={[
        "Real-Time Video Call Translator & Caption Generator",
        3000,
        "जब हम मिले",
        3000,
        "ನಾವು ಭೇಟಿಯಾದಾಗ",
        3000,
        "お目にかかった際に",
        3000,
      ]}
      wrapper="h2"
      className="gradient-text text-3xl font-semibold sm:text-3xl lg:text-3xl xl:text-5xl 2xl:text-6xl"
      repeat={Infinity}
    />
  );
}
