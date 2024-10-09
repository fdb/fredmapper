import { html, render, useEffect, useState } from "./preact_standalone.module.js";

function SceneObject({ projectURL, scene, object }) {
  let style = `transform: translate(-50%, -50%) scale(${object.scale[0]}, ${object.scale[1]});`;
  if (object.feather) {
    const featherAmount = 100 - object.feather * 100;
    style += `mask-image: radial-gradient(closest-corner, #000 0, transparent ${featherAmount}%, transparent 100%)`;
  }
  let element;
  if (object.type === "image") {
    element = html`<img src="${projectURL}/${object.path}" style=${style} />`;
  } else if (object.type === "video") {
    element = html`<video src="${projectURL}/${object.path}" style=${style} autoplay muted />`;
  }
  return html`<div
    class="scene-object scene-${object.type}"
    style="left: ${object.position[0] * 100}%;
           top: ${object.position[1] * 100}%;
           "
  >
    ${element}
  </div>`;
}

function Viewer({ projectURL, scene }) {
  return html`<div class="viewer">
    <div class="scene">
      ${scene.objects.map((o) => html`<${SceneObject} projectURL=${projectURL} scene=${scene} object=${o} />`)}
    </div>
  </div>`;
}

function TestImage() {
  return html`<div class="test-image" />`;
}

function App() {
  const [fullscreen, setFullscreen] = useState(false);
  const [testImage, setTestImage] = useState(false);
  const [projectURL, setProjectURL] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.electronAPI.onProjectOpened(({ project, projectURL }) => {
      setProject(project);
      setProjectURL(projectURL);
      console.log("project opened", { project, projectURL });
    });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleKeyDown(e) {
    if (e.key === "f") {
      setFullscreen(true);
      document.getElementById("root").requestFullscreen();
    } else if (e.key === "t") {
      setTestImage((testImage) => !testImage);
    }
  }

  if (!project) {
    return html`<div className="loading">Loading...</div>`;
  }

  if (testImage) {
    return html`<div class="app"><${TestImage} /></div>`;
  }

  return html`<div class="app"><${Viewer} projectURL=${projectURL} scene=${project.scenes[0]} /></div>`;
}

render(html`<${App} />`, document.getElementById("root"));
