import { html, render, useEffect, useState } from "/js/preact_standalone.module.js";

function SceneObject({ projectId, scene, object }) {
  let style = `transform: translate(-50%, -50%) scale(${object.scale[0]}, ${object.scale[1]});`;
  if (object.feather) {
    const featherAmount = 100 - object.feather * 100;
    style += `mask-image: radial-gradient(closest-corner, #000 0, transparent ${featherAmount}%, transparent 100%)`;
  }
  let element;
  if (object.type === "image") {
    element = html`<img src="/projects/${projectId}/${object.path}" style=${style} />`;
  } else if (object.type === "video") {
    element = html`<video src="/projects/${projectId}/${object.path}" style=${style} autoplay muted />`;
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

function Viewer({ projectId, scene }) {
  return html`<div class="viewer">
    <div class="scene">
      ${scene.objects.map((o) => html`<${SceneObject} projectId=${projectId} scene=${scene} object=${o} />`)}
    </div>
  </div>`;
}

function TestImage() {
  return html`<div class="test-image" />`;
}

function App() {
  const [fullscreen, setFullscreen] = useState(false);
  const [testImage, setTestImage] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const projectId = params.get("projectId") || "default";
    setProjectId(projectId);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  async function fetchProject() {
    if (!projectId) return;
    const response = await fetch(`/projects/${projectId}/project.json`);
    const data = await response.json();
    setProject(data);
  }

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

  return html`<div class="app"><${Viewer} projectId=${projectId} scene=${project.scenes[0]} /></div>`;
}

render(html`<${App} />`, document.getElementById("root"));
