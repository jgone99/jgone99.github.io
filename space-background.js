// variable definitions

const SCREEN_W = screen.width
const SCREEN_H = screen.height

const min_device_width = 768

let CANVAS_SCALE = 1

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

const spaceship_sprite_url = 'spaceship.png'
let spaceship_img = null

const planet_texture_urls = ['planet0.png', 'planet1.png', 'planet2.png']
const planet_textures = []

const planet_data = {
    0: {
        size: null,
        x: pseudo_canvas_width * 0.15,
        y: pseudo_canvas_height * 0.4,
        x_mult: 0.15,
        y_mult: 0.4,
        x_mult_min: 0.05,
        y_mult_min: 0.2,
        tilt_deg: 25,
        offset: 0,
        rot_speed: 10,
        dt: 0,
        filter: 0.55,
        size_const: 340,
        size_const_min: 170,
        frame_width: 378,
        frame_height: 376
    },
    1: {
        size: null,
        x: pseudo_canvas_width * 0.5,
        y: pseudo_canvas_height * 0.7,
        x_mult: 0.5,
        y_mult: 0.7,
        x_mult_min: 0.5,
        y_mult_min: 0.7,
        tilt_deg: 35,
        offset: 0,
        rot_speed: 20,
        dt: 0,
        filter: 0.7,
        size_const: 170,
        size_const_min: 85,
        frame_width: 378,
        frame_height: 376
    },
    2: {
        size: null,
        x: pseudo_canvas_width * 1.15,
        y: pseudo_canvas_height * 0.8,
        x_mult: 1.15,
        y_mult: 0.8,
        x_mult_min: 1.10,
        y_mult_min: 1,
        tilt_deg: -20,
        offset: 0,
        rot_speed: 10,
        dt: 0,
        filter: 0.35,
        size_const: 820,
        size_const_min: 410,
        frame_width: 1512,
        frame_height: 1504
    },
    // 3: {
    //     size: 200
    // },
    // 4: {
    //     size: 200
    // },
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

let ship_dt = 0
let last_timestamp = null
let texture_offset = 0

let MAX_ROTATION_SPEED = 100 // degrees per second

const ship_frame_width = 850
const ship_frame_height = 850
const total_rotation_frames = 24
const total_thrust_frames = 6
let ship_rotation_frame = 0
let thrust_frame = 0
let ship_frame_rate = 80
let prev_ship_frame_time = 0

let paused = false
let animation_id = null
let animation_start = null
let animation_pause_dt = 0

let slider_dialog_open = false

const $stars = document.getElementById('stars-wrapper')
const $stars1 = document.getElementById('stars-1')
const $stars2 = document.getElementById('stars-2')
const $stars3 = document.getElementById('stars-3')
const $slider_dialog = document.getElementById('slider-dialog')

// event listeners

window.addEventListener("mousemove", handleMouseMove)
window.addEventListener("resize", handleResize)
window.addEventListener("blur", stopAnimation);
window.addEventListener("focus", startAnimation);
window.addEventListener("load", () => {
    $stars.classList.replace('disabled', 'enabled')
    $canvas.classList.replace('disabled', 'enabled')
})

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
    if (slider_dialog_open) {
        slider_dialog_open = false
        $slider_dialog.classList.add('enabled', 'disabled')
    }
    else {
        slider_dialog_open = true
        $slider_dialog.classList.remove('disabled', 'enabled')
    }
}

document.getElementById('pixel-checkbox').onclick = (e) => {
    if (e.target.checked) {
        resizePseudoCanvas(0.24)
    }
    else {
        resizePseudoCanvas(1)
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        stopAnimation()
    } else {
        startAnimation()
    }
});

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

    const is_min_width = WINDOW_W > min_device_width
    Object.values(planet_data).forEach((planet) => {
        planet.size = CANVAS_SCALE * (is_min_width ? planet.size_const : planet.size_const_min)
        planet.x = pseudo_canvas_width * (is_min_width ? planet.x_mult : planet.x_mult_min)
        planet.y = pseudo_canvas_height * (is_min_width ? planet.y_mult :planet.y_mult_min)
    })
    ship_data.size = ship_data.size_const * CANVAS_SCALE
    ship_data.x *= scale_ratio
    ship_data.y *= scale_ratio
    ship_data.max_speed = ship_data.max_speed_const * pseudo_canvas_width * WINDOW_H
    ship_data.damp_dist_2 = ship_data.damp_dist_cost * pseudo_canvas_width
}

function generateStars(count1, count2, count3) {
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

    $stars1.style.boxShadow = shadows1.join(', ')
    $stars2.style.boxShadow = shadows2.join(', ')
    $stars3.style.boxShadow = shadows3.join(', ')
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

    const is_min_width = WINDOW_W > min_device_width
    Object.values(planet_data).forEach((planet) => {
        planet.size = CANVAS_SCALE * (is_min_width ? planet.size_const : planet.size_const_min)
        planet.x = pseudo_canvas_width * (is_min_width ? planet.x_mult : planet.x_mult_min)
        planet.y = pseudo_canvas_height * (is_min_width ? planet.y_mult :planet.y_mult_min)
    })

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
        planet.offset = (planet.offset + planet.rot_speed * dt) % (planet_textures[index].width - planet.frame_width)
    })
}

function shiftBackground() {
    const xRatio = ship_data.x / pseudo_canvas_width - 0.5
    const yRatio = ship_data.y / pseudo_canvas_height - 0.5
    const moveX = -xRatio
    const moveY = -yRatio

    $stars2.style.transform = `translate(calc(${-xRatio * 60}px), calc(${-yRatio * 60}px))`
    $stars3.style.transform = `translate(calc(${-xRatio * 120}px), calc(${-yRatio * 120}px))`
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
        ship_rotation_frame = (ship_rotation_frame + (ship_data.speed / ship_data.max_speed > 0.1 ? 1 : 0)) % total_rotation_frames
        ship_dt = 0
    }
}

function drawPlanets() {

    planet_textures.forEach((texture, index) => {
        ctx.save()
        const { x, y, size, tilt_deg, offset, filter, frame_width, frame_height } = planet_data[index]

        ctx.translate(x, y)
        ctx.rotate(tilt_deg * Math.PI / 180)

        ctx.beginPath()
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
        ctx.clip()

        ctx.drawImage(
            texture,
            offset,
            0,
            frame_width,
            frame_height,
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
    const frame_x = ship_rotation_frame * ship_frame_width
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
    WINDOW_W = window.innerWidth
    WINDOW_H = window.innerHeight
    const prev_width = pseudo_canvas_width
    const prev_height = pseudo_canvas_height
    pseudo_canvas_width = WINDOW_W * CANVAS_SCALE
    pseudo_canvas_height = WINDOW_H * CANVAS_SCALE
    $canvas.width = pseudo_canvas_width
    $canvas.height = pseudo_canvas_height
    $canvas.style.width = WINDOW_W + 'px'
    $canvas.style.height = WINDOW_H + 'px'
    ctx.imageSmoothingEnabled = false

    const is_min_width = WINDOW_W > min_device_width
    Object.values(planet_data).forEach((planet) => {
        planet.size = CANVAS_SCALE * (is_min_width ? planet.size_const : planet.size_const_min)
        planet.x = pseudo_canvas_width * (is_min_width ? planet.x_mult : planet.x_mult_min)
        planet.y = pseudo_canvas_height * (is_min_width ? planet.y_mult : planet.y_mult_min)
    })

    if(animation_id === null) {
        drawAll()
    }
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

function startAnimation() {
    if (paused) return
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
    updatePlanets(dt)
    updateShip(dt)
    updateShipFrame(dt)
    drawAll()
    
    animation_id = requestAnimationFrame(animateBackground)
}