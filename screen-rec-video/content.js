// inject camera into the corner of the page
// that has the permissions to access the camera

window.cameraId = "ab-camera";

window.camera = document.getElementById(cameraId);

//check if camera exists
if (window.camera) {
  console.log("Camera Found", camera);

  // make sure it is visible
  document.querySelector("#ab-camera").style.display = "block";
} else {
  const cameraElement = document.createElement("iframe");
  cameraElement.id = cameraId;
  cameraElement.setAttribute(
    "style",
    ` all: initial;
  position: fixed;
  width:200px;
  height:200px; 
  top:10px;
  right:10px;
  border-radius: 100px;
  background: black;
  z-index: 999999;
  border:none;`
  );

  // set permiissions on iframe - camera and microphone
  cameraElement.setAttribute("allow", "camera; microphone");

  cameraElement.src = chrome.runtime.getURL("camera.html");
  document.body.appendChild(cameraElement);

  // make sure it is visible
  document.querySelector("#ab-camera").style.display = "block";
}
