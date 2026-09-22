const shirt = new Image();

shirt.src = "/frontend/assets/clothes/black-tshirt.svg";

let shirtLoaded = false;

shirt.onload = () => {
    shirtLoaded = true;
    console.log("✅ T-shirt loaded successfully");
};

shirt.onerror = (error) => {
    console.error("❌ T-shirt failed to load:", error);
};


/*
 * Draw the virtual shirt
 */
export function drawClothing(
    ctx,
    leftShoulder,
    rightShoulder,
    leftHip,
    rightHip,
    canvas
) {
    if (!shirtLoaded) {
        return;
    }

    // -----------------------------
    // 1. Shoulder measurements
    // -----------------------------

    const shoulderWidth = Math.hypot(
        rightShoulder.x - leftShoulder.x,
        rightShoulder.y - leftShoulder.y
    );

    const shoulderCenterX =
        (leftShoulder.x + rightShoulder.x) / 2;

    const shoulderCenterY =
        (leftShoulder.y + rightShoulder.y) / 2;


    // -----------------------------
    // 2. Hip measurements
    // -----------------------------

    const hipCenterX =
        (leftHip.x + rightHip.x) / 2;

    const hipCenterY =
        (leftHip.y + rightHip.y) / 2;


    // -----------------------------
    // 3. Torso height
    // -----------------------------

    const torsoHeight = Math.hypot(
        hipCenterX - shoulderCenterX,
        hipCenterY - shoulderCenterY
    );


    // -----------------------------
    // 4. Shirt dimensions
    // -----------------------------

    const shirtWidth =
        shoulderWidth * 1.45;

    const shirtHeight =
        torsoHeight * 1.35;


    // -----------------------------
    // 5. Shirt position
    // -----------------------------

    /*
     * Don't center the shirt halfway
     * between shoulders and hips.
     *
     * Start it slightly below the
     * shoulder line.
     */

    const centerX =
        shoulderCenterX;

    const centerY =
        shoulderCenterY +
        torsoHeight * 0.48;


    // -----------------------------
    // 6. Body rotation
    // -----------------------------

    const angle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
    );


    // -----------------------------
    // 7. Draw
    // -----------------------------

    ctx.save();

    ctx.translate(
        centerX,
        centerY
    );

    ctx.rotate(angle);


    /*
     * Our SVG itself has a lot of
     * transparent space around the
     * actual shirt.
     *
     * Slightly crop it while drawing.
     */

    const drawWidth =
        shirtWidth * 1.05;

    const drawHeight =
        shirtHeight * 1.05;


    ctx.drawImage(
        shirt,

        -drawWidth / 2,
        -drawHeight / 2,

        drawWidth,
        drawHeight
    );

    ctx.restore();
}