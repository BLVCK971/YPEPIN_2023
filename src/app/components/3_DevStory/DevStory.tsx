import "./DevStyle.css";
import Schneider from "./Companies/Schneider";
import Digitom from "./Companies/Digitom";

export default function DevStory() {
  return (
    <div className="md:p-24 p-2">
    <Schneider/>
    <Digitom/>
    </div>
  );
}
