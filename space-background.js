// variable definitions

const SCREEN_W = screen.width
const SCREEN_H = screen.height

let CANVAS_SCALE = 0.25

let WINDOW_W = window.innerWidth
let WINDOW_H = window.innerHeight

let pseudo_canvas_width = WINDOW_W * CANVAS_SCALE
let pseudo_canvas_height = WINDOW_H * CANVAS_SCALE

const $canvas = document.getElementById('background-canvas');

const ctx = $canvas.getContext('2d')

const cursor = {
    x: pseudo_canvas_width / 2,
    y: pseudo_canvas_height / 2,
}

const spaceship_sprite_url = 'spaceship1.png'
let spaceship_img = null

const planet_texture_urls = ['planet0.png', 'planet1.png']
const planet_textures = []

const planet_data = {
    0: {
        size: 340 * CANVAS_SCALE,
        size_mult: 0.3,
        x: pseudo_canvas_width * 0.15,
        y: pseudo_canvas_height * 0.4,
        x_mult: 0.15,
        y_mult: 0.4,
        tilt_deg: 25,
        offset: 0,
        mill_per_frame: 70,
        dt: 0,
        filter: 0.55,
        size_const: 340
    },
    1: {
        size: 170 * CANVAS_SCALE,
        size_mult: 0.15,
        x: pseudo_canvas_width * 0.5,
        y: pseudo_canvas_height * 0.7,
        x_mult: 0.5,
        y_mult: 0.7,
        tilt_deg: 35,
        offset: 0,
        mill_per_frame: 30,
        dt: 0,
        filter: 0.7,
        size_const: 170
    },
    2: {
        size: 200
    },
    3: {
        size: 200
    },
    4: {
        size: 200
    },
}

const ship_data = {
    x: pseudo_canvas_width / 2,
    y: pseudo_canvas_height / 2,
    angle: 0,
    size: 80 * CANVAS_SCALE,
    speed: 0,
    size_const: 80,
    max_speed: WINDOW_H * pseudo_canvas_width * 0.00005,
    damp_dist_2: pseudo_canvas_width * 20,
    max_speed_const: 0.00005,
    damp_dist_cost: 20
}

const planet_frame_width = 378
const planet_frame_height = 376

let planet_dt = 0
let ship_dt = 0
let last_timestamp = null
let texture_offset = 0

let MAX_ROTATION_SPEED = 100 // degrees per second

const ship_frame_width = 850
const ship_frame_height = 850
const total_rotation_frames = 24
const total_thrust_frames = 6
let rotation_frame = 0
let thrust_frame = 0
let ship_frame_rate = 80
let prev_ship_frame_time = 0
const max_ticks = 10
let speed_ticks = 5

const LEFT_BOUND = -ship_data.size
const RIGHT_BOUND = WINDOW_W + ship_data.size
const TOP_BOUND = -ship_data.size
const BOTTOM_BOUND = WINDOW_H + ship_data.size

let paused = false
let animation_id = null
let animation_start = null
let animation_pause_dt = 0

let slider_dialog_open = false

const $stars = document.getElementById('stars-wrapper')
const $slider_dialog = document.getElementById('slider-dialog')

// event listeners

window.addEventListener("mousemove", handleMouseMove)
window.addEventListener("resize", handleResize)

document.getElementById('pause-play-btn').onclick = (e) => {
    if (paused) {
        paused = false
        e.target.classList.replace('fa-play', 'fa-pause')
        startAnimation()
    }
    else {
        paused = true
        e.target.classList.replace('fa-pause', 'fa-play')
        stopAnimation()
    }
}

document.getElementById('slider-dialog-btn').onclick = (e) => {
    console.log('dialog')
    if (slider_dialog_open) {
        slider_dialog_open = false
        $slider_dialog.classList.replace('opacity-100', 'opacity-0')
    }
    else {
        slider_dialog_open = true
        $slider_dialog.classList.replace('opacity-0', 'opacity-100')
    }
}

document.getElementById('pixel-checkbox').onclick = (e) => {
    if (e.target.checked) {
        resizePseudoCanvas(0.24)
    }
    else {
        resizePseudoCanvas(1)
    }
    console.log(CANVAS_SCALE)

}

// function calls

init()


// function definitions

function resizePseudoCanvas(scale) {
    const scale_ratio = scale / CANVAS_SCALE
    cursor.x *= scale_ratio
    cursor.y *= scale_ratio
    CANVAS_SCALE = scale
    pseudo_canvas_width = WINDOW_W * CANVAS_SCALE
    pseudo_canvas_height = WINDOW_H * CANVAS_SCALE
    $canvas.width = pseudo_canvas_width
    $canvas.height = pseudo_canvas_height
    ctx.imageSmoothingEnabled = false
    Object.values(planet_data).forEach((planet) => {
        planet.size = planet.size_const * CANVAS_SCALE
        planet.x = pseudo_canvas_width * planet.x_mult
        planet.y = pseudo_canvas_height * planet.y_mult
    })
    ship_data.size = ship_data.size_const * CANVAS_SCALE
    ship_data.x *= scale_ratio
    ship_data.y *= scale_ratio
    ship_data.max_speed = ship_data.max_speed_const * pseudo_canvas_width * WINDOW_H
    ship_data.damp_dist_2 = ship_data.damp_dist_cost * pseudo_canvas_width
}

function generateStars(count1, count2, count3) {
    const stars1 = document.getElementById('stars-1')
    const stars2 = document.getElementById('stars-2')
    const stars3 = document.getElementById('stars-3')

    const size = Math.max(SCREEN_W, SCREEN_H) * 1.1
    const shadows1 = []
    const shadows2 = []
    const shadows3 = []

    for (let i = 0; i < count1; i++) {
        const x = Math.floor(Math.random() * size - size / 2)
        const y = Math.floor(Math.random() * size - size / 2)
        const brightness = Math.floor(180 + Math.random() * 75)
        const color = `rgb(${brightness}, ${brightness}, ${brightness})`
        shadows1.push(`${color} ${x}px ${y}px`)
    }

    for (let i = 0; i < count2; i++) {
        const x = Math.floor(Math.random() * size - size / 2)
        const y = Math.floor(Math.random() * size - size / 2)
        const brightness = Math.floor(180 + Math.random() * 75)
        const color = `rgb(${brightness}, ${brightness}, ${brightness})`
        shadows2.push(`${color} ${x}px ${y}px`)
    }

    for (let i = 0; i < count3; i++) {
        const x = Math.floor(Math.random() * size - size / 2)
        const y = Math.floor(Math.random() * size - size / 2)
        const brightness = Math.floor(180 + Math.random() * 75)
        const color = `rgb(${brightness}, ${brightness}, ${brightness})`
        shadows3.push(`${color} ${x}px ${y}px`)
    }

    stars1.style.boxShadow = shadows1.join(', ')
    stars2.style.boxShadow = shadows2.join(', ')
    stars3.style.boxShadow = shadows3.join(', ')
}

function init() {
    $canvas.width = SCREEN_W
    $canvas.height = SCREEN_H
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    $canvas.width = pseudo_canvas_width
    $canvas.height = pseudo_canvas_height
    $canvas.style.width = WINDOW_W + 'px'
    $canvas.style.height = WINDOW_H + 'px'
    ctx.imageSmoothingEnabled = false
    initStars()
    loadTextures().then(startAnimation)
}

function initStars() {
    const pixels = Math.max(window.innerWidth, window.innerHeight)
    const density1 = 5500 // 1 star per 2500 pixels squared
    const density2 = 10500
    const density3 = 100500
    const count1 = Math.floor((pixels * pixels) / density1)
    const count2 = Math.floor((pixels * pixels) / density2)
    const count3 = Math.floor((pixels * pixels) / density3)
    generateStars(count1, count2, count3)
}

function loadTextures() {
    const promises = planet_texture_urls.map((url) => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
            img.src = url
            planet_textures.push(img)
        })
    })
    promises.push(new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`Failed to load image: ${spaceship_sprite_url}`))
        img.src = spaceship_sprite_url
        spaceship_img = img
    }))

    return Promise.all(promises)
}

function updatePlanets(dt) {
    Object.values(planet_data).forEach((planet, index) => {
        planet.dt += dt
        if (planet.dt * 1000 > planet.mill_per_frame) {
            planet.offset = (planet.offset + 1) % (planet_textures[index].width - planet_frame_width)
            planet.dt = 0
        }
    })

}

function shiftBackground() {
    const xRatio = cursor.x / WINDOW_W - 0.5
    const yRatio = cursor.y / WINDOW_H - 0.5
    const moveX = -xRatio * 30
    const moveY = -yRatio * 30

    $stars.style.transform = `translate(calc(${moveX}px), calc(${moveY}px))`
}

function updateShip(dt) {
    const dx = cursor.x - (ship_data.x + ship_data.size / 2)
    const dy = cursor.y - (ship_data.y + ship_data.size / 2)
    rotateShip(dt, dx, dy)
    moveForward(dt, dx, dy)
}

function updateShipFrame(dt) {
    ship_dt += dt
    thrust_frame = total_thrust_frames - parseInt((total_thrust_frames - 1) * (ship_data.speed / ship_data.max_speed)) - 1

    if (ship_dt * 1000 > ship_frame_rate) {
        rotation_frame = (rotation_frame + (ship_data.speed / ship_data.max_speed > 0.1 ? 1 : 0)) % total_rotation_frames
        ship_dt = 0
    }
}

function drawPlanets() {

    planet_textures.forEach((texture, index) => {
        ctx.save()
        const { x, y, size, tilt_deg, offset, filter } = planet_data[index]

        // const lowRes = document.createElement('canvas');
        // const lowCtx = lowRes.getContext('2d');
        // const sizen = Math.ceil(size / 4);

        // lowRes.width = sizen;
        // lowRes.height = sizen;

        // lowCtx.fillStyle = 'black';
        // lowCtx.beginPath();
        // lowCtx.arc(sizen / 2, sizen / 2, sizen / 2, 0, Math.PI * 2);
        // lowCtx.fill();

        ctx.translate(x, y)
        ctx.rotate(tilt_deg * Math.PI / 180)

        ctx.beginPath()
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
        ctx.clip()

        ctx.drawImage(
            texture,
            offset,
            0,
            planet_frame_width,
            planet_frame_height,
            -size / 2,
            -size / 2,
            size,
            size
        )
        ctx.fillStyle = `rgba(0, 0, 0, ${filter})`
        ctx.fillRect(-size / 2 - 4, -size / 2 - 4, size + 8, size + 8)
        ctx.restore()
    })

}

function drawShipSprite() {
    ctx.save()
    const frame_x = rotation_frame * ship_frame_width
    const frame_y = thrust_frame * ship_frame_width

    const { x, y, angle, size } = ship_data

    ctx.translate(x + size / 2, y + size / 2)
    ctx.rotate(angle * Math.PI / 180 + Math.PI / 2)
    ctx.translate(-x - size / 2, -y - size / 2)

    ctx.drawImage(
        spaceship_img,
        frame_x,
        frame_y,
        ship_frame_width,
        ship_frame_height,
        x,
        y,
        size,
        size
    )
    ctx.restore()
}

function drawAll() {
    ctx.clearRect(0, 0, pseudo_canvas_width, pseudo_canvas_height)
    drawPlanets()
    drawShipSprite()
}

function handleMouseMove(e) {
    cursor.x = e.clientX / WINDOW_W * pseudo_canvas_width
    cursor.y = e.clientY / WINDOW_H * pseudo_canvas_height
}

function handleResize(e) {
    console.log('resize')
    WINDOW_W = window.innerWidth
    WINDOW_H = window.innerHeight
    pseudo_canvas_width = WINDOW_W * CANVAS_SCALE
    pseudo_canvas_height = WINDOW_H * CANVAS_SCALE

    Object.values(planet_data).forEach((planet) => {
        planet.x = pseudo_canvas_width * planet.x_mult
        planet.y = pseudo_canvas_height * planet.y_mult
    })
}

function rotateShip(dt, dx, dy) {
    let max_rotation = MAX_ROTATION_SPEED * dt
    const d_angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360 // converting to angle and to 0 to 360 degree coordinate system
    let angle_diff = normalizeAngle(d_angle - ship_data.angle)
    angle_diff = angle_diff < -180 ? 360 + angle_diff : angle_diff // convereting negative destination coordinates to positive equivalent to work with CSS transform rotation
    const rotation = Math.abs(angle_diff) < max_rotation ? angle_diff : Math.sign(angle_diff) * max_rotation
    let ease_out_rotation = easeInOutQuad(Math.min(Math.abs(angle_diff) / 90, 1)) * rotation // cool easing out the rotation effect
    ship_data.angle += ease_out_rotation
}

function normalizeAngle(angle) {
    return ((angle + 180) % 360) - 180;
}

function moveForward(dt, dx, dy) {
    const rad = (ship_data.angle) * Math.PI / 180; // Adjust for CSS 0° being "up"
    const dist2 = Math.pow(dx, 2) + Math.pow(dy, 2)
    const frac = Math.min(dist2 / ship_data.damp_dist_2, 1)
    const translation_speed = ship_data.max_speed * easeInOutQuad(frac)
    ship_data.x += Math.cos(rad) * translation_speed * dt
    ship_data.y += Math.sin(rad) * translation_speed * dt
    ship_data.speed = translation_speed

    //checkBounds()

    // if (distance(ship_state.x, ship_state.y, prev_ship_x, prev_ship_y) >= DASH_SPACING) {
    //     const $dash = document.createElement("div")
    //     $dash.className = "dash"
    //     $dash.style.transform = 
    //     `translate(${ship_state.x + SHIP_CENTER_OFFSET - DASH_W / 2}px, ${ship_state.y + SHIP_CENTER_OFFSET - DASH_H / 2}px) rotate(${ship_state.angle}deg)`
    //     $container.appendChild($dash)
    //     prev_ship_x = ship_state.x
    //     prev_ship_y = ship_state.y

    //     setTimeout(() => {
    //         $dash.remove()
    //     }, 2000)
    // }  
}

function easeInOutQuad(t) {
    return t < 0.5
        ? t * (2 - t)
        : -1 + (4 - 2 * t) * t;
}

function checkBounds() {
    const shipCenterX = ship_data.x + ship_data.size / 2
    const shipCenterY = ship_data.y + ship_data.size / 2

    if (shipCenterX <= LEFT_BOUND) {
        setShipCenterX(LEFT_BOUND + 1)
    }
    else if (shipCenterX >= RIGHT_BOUND) {
        setShipCenterX(RIGHT_BOUND - 1)
    }
    if (shipCenterY <= TOP_BOUND) {
        setShipCenterY(TOP_BOUND + 1)
    }
    else if (shipCenterY >= BOTTOM_BOUND) {
        setShipCenterY(BOTTOM_BOUND - 1)
    }
}

function startAnimation() {
    if (!animation_id) {
        last_timestamp = performance.now()
        animation_id = requestAnimationFrame(animateBackground)
    }
}

function stopAnimation() {
    if (animation_id) {
        cancelAnimationFrame(animation_id)
        animation_id = null
        animation_pause_dt += performance.now() - last_timestamp
    }
}

function animateBackground(timestamp) {
    if (last_timestamp === null) last_timestamp = timestamp

    const dt = (timestamp - last_timestamp) / 1000
    last_timestamp = timestamp
    shiftBackground()
    updatePlanets(dt)
    updateShip(dt)
    updateShipFrame(dt)
    drawAll()

    animation_id = requestAnimationFrame(animateBackground)
}