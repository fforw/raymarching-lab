// noinspection ES6UnusedImports
import STYLE from "./style.css"

import mandalaFragmentShader from "./mandala.frag"
import mandalaVertexShader from "./mandala.vert"
import loadImage from "./loadImage";

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0
};

let canvas, gl;


// uniform: current time
let u_time;

let u_resolution;

let u_mouse;

let mouseX = 0, mouseY = 0, mouseDown, startX, startY;

function main(time)
{
    const f = mouseDown ? 1 : -1;

    // update uniforms
    gl.uniform1f(u_time, time / 1000.0);
    gl.uniform2f(u_resolution, config.width, config.height);
    gl.uniform4f(u_mouse, mouseX, config.height - mouseY, startX * f, (config.height - startY) * f);

    // Draw the quad
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(main);
}


const vertices = [
    -1, 1, 0.0,
    -1, -1, 0.0,
    1, -1, 0.0,
    1, 1, 0.0
];

const indices = [3, 2, 1, 3, 1, 0];

function resize(ev)
{
    const width = (window.innerWidth) & ~15;
    const height = (window.innerHeight) | 0;

    config.width = width;
    config.height = height;

    canvas.width = width;
    canvas.height = height;

    mouseX = width/2;
    mouseY = height/2;

    gl.viewport(0, 0, canvas.width, canvas.height);
}

window.onload = () => {

    canvas = document.getElementById("screen");

    const width = (window.innerWidth) & ~15;
    const height = (window.innerHeight) | 0;

    config.width = width;
    config.height = height;

    canvas.width = width;
    canvas.height = height;

    mouseX = width/2;
    mouseY = height/2;

    gl = canvas.getContext("webgl2");

    /*========== Defining and storing the geometry =========*/

    // Create an empty buffer object to store vertex buffer
    const vertex_buffer = gl.createBuffer();

    // Bind appropriate array buffer to it
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    // Pass the vertex data to the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Unbind the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Create an empty buffer object to store Index buffer
    const Index_Buffer = gl.createBuffer();

    // Bind appropriate array buffer to it
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);

    // Pass the vertex data to the buffer
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Unbind the buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    /*====================== Shaders =======================*/

    // Create a vertex shader object
    const vertShader = gl.createShader(gl.VERTEX_SHADER);

    // Attach vertex shader source code
    gl.shaderSource(vertShader, mandalaVertexShader);

    // Compile the vertex shader
    gl.compileShader(vertShader);

    // Create fragment shader object
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);

    // Attach fragment shader source code
    gl.shaderSource(fragShader, mandalaFragmentShader);

    // Compile the fragment shader
    gl.compileShader(fragShader);

    let error = false;
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS))
    {
        console.error("Invalid vertex shader", gl.getShaderInfoLog(vertShader));
        error = true;
    }
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS))
    {
        console.error("Invalid fragment shader", gl.getShaderInfoLog(fragShader));
        error = true;
    }

    if (error)
    {
        return;
    }

    // Create a shader program object to
    // store the combined shader program
    const shaderProgram = gl.createProgram();

    // Attach a vertex shader
    gl.attachShader(shaderProgram, vertShader);

    // Attach a fragment shader
    gl.attachShader(shaderProgram, fragShader);

    // Link both the programs
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
    {
        console.error(gl.getProgramInfoLog(shaderProgram));
        return;
    }

    // get uniform locations
    u_time = gl.getUniformLocation(shaderProgram, "u_time");
    u_resolution = gl.getUniformLocation(shaderProgram, "u_resolution");
    u_mouse = gl.getUniformLocation(shaderProgram, "u_mouse");

    // Use the combined shader program object
    gl.useProgram(shaderProgram);

    /* ======= Associating shaders to buffer objects =======*/

    // Bind vertex buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    // Bind index buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);

    // Get the attribute location
    const coord = gl.getAttribLocation(shaderProgram, "coordinates");

    // Point an attribute to the currently bound VBO
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);

    // Enable the attribute
    gl.enableVertexAttribArray(coord);

    // Clear the canvas
    gl.clearColor(0,0,0,1);

    // Enable the depth test
    gl.enable(gl.DEPTH_TEST);

    // Clear the color buffer bit
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the view port
    gl.viewport(0, 0, canvas.width, canvas.height);

    window.addEventListener("resize", resize, true);
    canvas.addEventListener("mousemove", onMouseMove, true);
    canvas.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("mouseup", onMouseUp, true);

    canvasBounds = document.getElementById("screen").getBoundingClientRect();

    requestAnimationFrame(main);
};


// Get the container element's bounding box
let canvasBounds;

// Apply the mouse event listener

function onMouseMove(ev)
{
    if (mouseDown)
    {
        mouseX = (ev.clientX - canvasBounds.left) + self.pageXOffset;
        mouseY = (ev.clientY - canvasBounds.top) + self.pageYOffset;
    }
}

function onMouseDown(ev)
{
    mouseDown = true;
    startX = (ev.clientX - canvasBounds.left) + self.pageXOffset;
    startY = (ev.clientY - canvasBounds.top) + self.pageYOffset;
    mouseX = startX;
    mouseY = startY;
}

function onMouseUp(ev)
{
    mouseDown = false;
}

