import "./DevStyle.css";
import Schneider from "./Companies/Schneider";
import Digitom from "./Companies/Digitom";

export default function DevStory() {
  return (
    <div className="p-24">
    <Schneider/>
    <Digitom/>
    </div>
  );
}
