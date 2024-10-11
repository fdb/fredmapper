import { html, render, useEffect, useState } from "./preact_standalone.module.js";

function SceneObject({ projectURL, targetSize, object }) {
  const [naturalWidth, setNaturalWidth] = useState(1);
  const [naturalHeight, setNaturalHeight] = useState(1);

  useEffect(() => {
    if (object.type === "image") {
      const img = new Image();
      img.onload = () => {
        setNaturalWidth(img.naturalWidth);
        setNaturalHeight(img.naturalHeight);
      };
      img.src = `${projectURL}/${object.path}`;
    }
  }, [object, projectURL]);

  const aspectRatio = naturalWidth / naturalHeight;
  const width = object.width * object.scale[0];
  const height = (object.width / aspectRatio) * object.scale[1];

  let style = `
    width: ${width}px;
    height: ${height}px;
    transform: translate(-50%, -50%);
  `;

  if (object.feather) {
    const featherAmount = 100 - object.feather * 100;
    style += `mask-image: radial-gradient(closest-corner, #000 0, transparent ${featherAmount}%, transparent 100%)`;
  }

  let element;
  if (object.type === "image") {
    element = html`<img src="${projectURL}/${object.path}" style="width: 100%; height: 100%; object-fit: cover;" />`;
  } else if (object.type === "video") {
    element = html`<video
      src="${projectURL}/${object.path}"
      style="width: 100%; height: 100%; object-fit: cover;"
      autoplay
      muted
      loop
    />`;
  }

  return html`<div
    class="scene-object scene-${object.type}"
    style="
      left: ${object.position[0]}px;
      top: ${object.position[1]}px;
      ${style}
    "
  >
    ${element}
  </div>`;
}

function Viewer({ projectURL, scene }) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const targetSize = scene.targetSize || [1920, 1080];

  useEffect(() => {
    const updateSize = () => {
      const container = document.querySelector(".viewer");
      if (container) {
        setContainerSize({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    window.addEventListener("resize", updateSize);
    updateSize();

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const scale = Math.min(containerSize.width / targetSize[0], containerSize.height / targetSize[1]);
  // Calculate the top and left positions to center the scene
  const scaledWidth = targetSize[0] * scale;
  const scaledHeight = targetSize[1] * scale;
  const left = (containerSize.width - scaledWidth) / 2;
  const top = (containerSize.height - scaledHeight) / 2;
  console.log({ containerSize, targetSize, scale });

  const sceneStyle = `
      top: ${top}px;
      left: ${left}px;
      width: ${targetSize[0]}px;
      height: ${targetSize[1]}px;
      transform: scale(${scale});
    `;

  return html`
    <div class="viewer">
      <div class="scene" style=${sceneStyle}>
        ${scene.objects.map(
          (o) => html`<${SceneObject} projectURL=${projectURL} targetSize=${targetSize} object=${o} />`
        )}
      </div>
    </div>
  `;
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
