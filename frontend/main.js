import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xf0f0f0)

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 2, 5)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)

// Center cube
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00aaff })
)
scene.add(cube)

// Ground
const grid = new THREE.GridHelper(10, 10)
scene.add(grid)

// Light
const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(5, 5, 5)
scene.add(light)

// WebSocket
const socket = new WebSocket("ws://localhost:8000/ws")
const players = {}

// Random color
const randColor = Math.floor(Math.random() * 0xffffff)

socket.onmessage = (event) => {
  const data = JSON.parse(event.data)

  Object.entries(data.players).forEach(([id, p]) => {
    if (!players[id]) {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        new THREE.MeshBasicMaterial({ color: p.color })
      )
      scene.add(sphere)
      players[id] = sphere
    }

    players[id].position.set(p.x, p.y-1, p.z)
  })
}

function sendPosition() {
  const dir = new THREE.Vector3()
  camera.getWorldDirection(dir)
  const pos = camera.position.clone().add(dir.multiplyScalar(2))

  if (socket.readyState === 1) {
    socket.send(JSON.stringify({ x: pos.x, y: pos.y, z: pos.z ,color: randColor }))
  }
}

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  sendPosition()
  renderer.render(scene, camera)
}

animate()