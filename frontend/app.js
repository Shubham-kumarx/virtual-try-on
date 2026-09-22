
import {
    PoseLandmarker,
    FilesetResolver,
    DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs";
import {
    drawClothing
} from "./js/clothing.js";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const status = document.getElementById("status");

let poseLandmarker;
let lastVideoTime = -1;


/* =========================
   LOAD MEDIAPIPE
========================= */

async function initializePose() {

    try {

        status.textContent = "Loading AI model...";

        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
        );

        poseLandmarker =
            await PoseLandmarker.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",

                        delegate: "GPU"
                    },

                    runningMode: "VIDEO",

                    numPoses: 1
                }
            );

        console.log("MediaPipe loaded!");

        status.textContent =
            "AI ready. Click Start Camera.";

        startButton.disabled = false;

    } catch (error) {

        console.error(
            "MediaPipe initialization error:",
            error
        );

        status.textContent =
            "Failed to load AI. Check Console.";

        startButton.disabled = true;
    }
}


/* =========================
   CAMERA
========================= */

async function startCamera() {

    try {

        status.textContent =
            "Starting camera...";

        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 1280,
                    height: 720,
                    facingMode: "user"
                },
                audio: false
            });

        video.srcObject = stream;

        await video.play();

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        status.textContent =
            "Camera running — detecting body...";

        detectPose();

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        status.textContent =
            "Camera error: " + error.message;
    }
}


/* =========================
   BODY DETECTION
========================= */

function detectPose() {

    if (!poseLandmarker) {

        requestAnimationFrame(
            detectPose
        );

        return;
    }

    if (
        video.readyState >= 2 &&
        video.currentTime !== lastVideoTime
    ) {

        lastVideoTime =
            video.currentTime;

        const results =
            poseLandmarker.detectForVideo(
                video,
                performance.now()
            );

        drawPose(results);
    }

    requestAnimationFrame(
        detectPose
    );
}


/* =========================
   DRAW BODY
========================= */

function drawPose(results) {

    /*
     * First draw the actual camera frame
     */

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    /*
     * No person
     */

    if (
        !results.landmarks ||
        results.landmarks.length === 0
    ) {

        status.textContent =
            "Camera running — no person detected.";

        return;
    }


    status.textContent =
        "Virtual try-on active ✓";


    const landmarks =
        results.landmarks[0];


    /*
     * Get important landmarks
     */

    const leftShoulder =
        getPoint(landmarks[11]);

    const rightShoulder =
        getPoint(landmarks[12]);

    const leftElbow =
        getPoint(landmarks[13]);

    const rightElbow =
        getPoint(landmarks[14]);

    const leftWrist =
        getPoint(landmarks[15]);

    const rightWrist =
        getPoint(landmarks[16]);

    const leftHip =
        getPoint(landmarks[23]);

    const rightHip =
        getPoint(landmarks[24]);


    /*
     * Draw virtual clothing
     */

    drawClothing(
        ctx,

        leftShoulder,
        rightShoulder,

        leftHip,
        rightHip,

        canvas
    );


    /*
     * Put arms back ON TOP
     */

    drawArm(
        ctx,
        leftShoulder,
        leftElbow,
        leftWrist
    );

    drawArm(
        ctx,
        rightShoulder,
        rightElbow,
        rightWrist
    );
}
function getPoint(landmark) {

    return {
        x: landmark.x * canvas.width,
        y: landmark.y * canvas.height
    };
}
function drawArm(
    ctx,
    shoulder,
    elbow,
    wrist
) {

    const armWidth =
        Math.hypot(
            elbow.x - shoulder.x,
            elbow.y - shoulder.y
        ) * 0.28;


    ctx.save();


    /*
     * Draw the arm-shaped region
     */

    ctx.beginPath();


    /*
     * Left/right sides of upper arm
     */

    const upperAngle =
        Math.atan2(
            elbow.y - shoulder.y,
            elbow.x - shoulder.x
        );

    const upperPerpX =
        Math.cos(
            upperAngle + Math.PI / 2
        ) * armWidth / 2;

    const upperPerpY =
        Math.sin(
            upperAngle + Math.PI / 2
        ) * armWidth / 2;


    ctx.moveTo(
        shoulder.x + upperPerpX,
        shoulder.y + upperPerpY
    );

    ctx.lineTo(
        elbow.x + upperPerpX,
        elbow.y + upperPerpY
    );


    /*
     * Continue around lower arm
     */

    const lowerAngle =
        Math.atan2(
            wrist.y - elbow.y,
            wrist.x - elbow.x
        );

    const lowerPerpX =
        Math.cos(
            lowerAngle + Math.PI / 2
        ) * armWidth / 2;

    const lowerPerpY =
        Math.sin(
            lowerAngle + Math.PI / 2
        ) * armWidth / 2;


    ctx.lineTo(
        wrist.x + lowerPerpX,
        wrist.y + lowerPerpY
    );

    ctx.lineTo(
        wrist.x - lowerPerpX,
        wrist.y - lowerPerpY
    );

    ctx.lineTo(
        elbow.x - upperPerpX,
        elbow.y - upperPerpY
    );

    ctx.lineTo(
        shoulder.x - upperPerpX,
        shoulder.y - upperPerpY
    );

    ctx.closePath();


    /*
     * Use this polygon as the mask
     */

    ctx.clip();


    /*
     * Put original camera pixels
     * back on top of the shirt.
     */

    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.restore();
}
function drawShirt(
    centerX,
    centerY,
    width,
    height,
    angle
) {

    ctx.save();

    /*
     * Move to body center
     */

    ctx.translate(
        centerX,
        centerY
    );

    /*
     * Rotate with body
     */

    ctx.rotate(angle);


    /*
     * Shirt dimensions
     */

    const halfWidth =
        width / 2;

    const halfHeight =
        height / 2;


    /*
     * Sleeve size
     */

    const sleeveWidth =
        width * 0.25;

    const sleeveHeight =
        height * 0.25;


    /*
     * Shirt body
     */

    ctx.beginPath();

    ctx.moveTo(
        -halfWidth,
        -halfHeight * 0.35
    );

    ctx.lineTo(
        halfWidth,
        -halfHeight * 0.35
    );

    ctx.lineTo(
        halfWidth * 0.82,
        halfHeight
    );

    ctx.lineTo(
        -halfWidth * 0.82,
        halfHeight
    );

    ctx.closePath();


    /*
     * Shirt color
     */

    ctx.fillStyle =
        "rgba(30, 100, 220, 0.90)";

    ctx.fill();


    /*
     * Left sleeve
     */

    ctx.beginPath();

    ctx.moveTo(
        -halfWidth,
        -halfHeight * 0.35
    );

    ctx.lineTo(
        -halfWidth - sleeveWidth,
        -halfHeight * 0.05
    );

    ctx.lineTo(
        -halfWidth * 0.82,
        halfHeight * 0.15
    );

    ctx.lineTo(
        -halfWidth * 0.65,
        -halfHeight * 0.20
    );

    ctx.closePath();

    ctx.fill();


    /*
     * Right sleeve
     */

    ctx.beginPath();

    ctx.moveTo(
        halfWidth,
        -halfHeight * 0.35
    );

    ctx.lineTo(
        halfWidth + sleeveWidth,
        -halfHeight * 0.05
    );

    ctx.lineTo(
        halfWidth * 0.82,
        halfHeight * 0.15
    );

    ctx.lineTo(
        halfWidth * 0.65,
        -halfHeight * 0.20
    );

    ctx.closePath();

    ctx.fill();


    /*
     * Neck opening
     */

    ctx.beginPath();

    ctx.arc(
        0,
        -halfHeight * 0.32,
        width * 0.12,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(10, 10, 10, 0.9)";

    ctx.fill();


    /*
     * Shirt outline
     */

    ctx.beginPath();

    ctx.moveTo(
        -halfWidth,
        -halfHeight * 0.35
    );

    ctx.lineTo(
        halfWidth,
        -halfHeight * 0.35
    );

    ctx.lineTo(
        halfWidth * 0.82,
        halfHeight
    );

    ctx.lineTo(
        -halfWidth * 0.82,
        halfHeight
    );

    ctx.closePath();

    ctx.strokeStyle =
        "rgba(255, 255, 255, 0.5)";

    ctx.lineWidth = 2;

    ctx.stroke();


    ctx.restore();
}


/* =========================
   BUTTON
========================= */

startButton.addEventListener(
    "click",
    startCamera
);


/* =========================
   START
========================= */

startButton.disabled = true;

initializePose();