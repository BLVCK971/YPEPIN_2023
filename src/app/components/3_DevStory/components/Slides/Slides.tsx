
import Script from 'next/script'


export const Slides: React.FC<{ id :string
}> = ({id }) => {
  return (
    <>
      <div id="three-container"></div>

      <Script src="Code/Slides/three/three.min.js"  strategy='afterInteractive'/>
      <Script src="Code/Slides/gsap/TweenMax.min.js"  strategy='afterInteractive'/>
      <Script src="Code/Slides/three/bas.js"  strategy='afterInteractive'/>
      <Script src="Code/Slides/three/OrbitControls-2.js" strategy='afterInteractive'/>
      <Script src="Code/Slides/THREE.js" />
    </>
  );
};

export default Slides;
