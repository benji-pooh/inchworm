const {
  Common,
  Engine,
  Render,
  Runner,
  Composites,
  MouseConstraint,
  Mouse,
  Composite,
  Bodies,
  Body,
  Constraint
} = Matter;

function organism(size) {
  var size = 10;
  var maxLength = size * 2;
  var minLength = maxLength / 2;
  var movementSpeed = 20 / size;
  var initialAngle = Math.random() * 360;
}

var particleOptions = {
  friction: 1,
  frictionStatic: 0.3,
  restitution: 0.8,
  render: {
    visible: true,
    fillStyle: "rgba(180, 81, 248, 0.8)"
  }
};

function softBody(
  xx,
  yy,
  columns,
  rows,
  columnGap,
  rowGap,
  crossBrace,
  particleRadius,
  particleOptions,
  constraintOptions
) {
  particleOptions = Common.extend({ inertia: 0 }, particleOptions);
  constraintOptions = Common.extend(
    {
      stiffness: 0.1,
      render: { type: "line", anchors: false, visible: false }
    },
    constraintOptions
  );

  var softBody = Composites.stack(
    xx,
    yy,
    columns,
    rows,
    columnGap,
    rowGap,
    function (x, y) {
      return Bodies.circle(
        x,
        y,
        particleRadius,
        Common.extend({ density: 0.5 }, particleOptions)
      );
    }
  );

  softBody.bodies[0].render.fillStyle = "black";
  Matter.Body.setDensity(softBody.bodies[0], 0.8);

  Composites.mesh(softBody, columns, rows, crossBrace, constraintOptions);

  var group = Body.nextGroup(true);

  var tail = Composites.stack(
    softBody.bodies[0].position.x,
    softBody.bodies[0].position.y - particleRadius * 2,
    8,
    1,
    particleRadius,
    0,
    function (x, y) {
      return Bodies.circle(
        x,
        y,
        particleRadius,
        Common.extend({ density: 0.00001 }, particleOptions)
      );
    }
  );

  Composites.chain(tail, 0, -0.25, 0, 0.25, {
    stiffness: 0.9,
    length: particleRadius,
    render: { type: "line", visible: false }
  });
  Composite.add(softBody, tail);

  Composite.add(
    softBody,
    Constraint.create({
      bodyA: tail.bodies[0],
      pointA: { x: 0, y: particleRadius },
      bodyB: softBody.bodies[0],
      pointB: { x: 0, y: 0 },
      stiffness: 0.9,
      length: particleRadius + 1,
      render: { type: "line", visible: false }
    })
  );

  function wag() {
    const value = Math.sin(engine.timing.timestamp / 100) + 0.05 * 2;
    $("#rotate").val(value.toFixed(3));
    Matter.Body.setAngularVelocity(softBody.bodies[0], value);
    requestAnimationFrame(wag);
  }
  wag();

  return softBody;
}

const container = document.getElementById("dishContainer");
WALL_WIDTH = 60;

// Start of stuff that's specific to the visualization
const engine = Engine.create();
engine.gravity.scale = 0;

const render = Render.create({
  element: container,
  engine: engine,
  options: {
    width: container.clientWidth,
    height: container.clientHeight,
    background: "transparent",
    wireframes: false,
    showAngleIndicator: false,
    showVelocity: false,
    pixelRatio: "auto"
  }
});

var ceiling = Bodies.rectangle(
  container.clientWidth / 2,
  0 - WALL_WIDTH / 2,
  9600,
  WALL_WIDTH,
  { isStatic: true }
);

let leftWall = Bodies.rectangle(
  0 - WALL_WIDTH / 2,
  container.clientHeight / 2,
  WALL_WIDTH,
  9600,
  { isStatic: true }
);

var floor = Bodies.rectangle(
  container.clientWidth / 2,
  container.clientHeight + WALL_WIDTH / 2,
  9600,
  WALL_WIDTH,
  { isStatic: true }
);

let rightWall = Bodies.rectangle(
  container.clientWidth + WALL_WIDTH / 2,
  container.clientHeight / 2,
  WALL_WIDTH,
  9600,
  { isStatic: true }
);

Composite.add(engine.world, [floor, ceiling, leftWall, rightWall]);

// add mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.9,
    render: {
      visible: false
    }
  }
});

Composite.add(engine.world, mouseConstraint);

// allow scroll through the canvas
mouseConstraint.mouse.element.removeEventListener(
  "mousewheel",
  mouseConstraint.mouse.mousewheel
);
mouseConstraint.mouse.element.removeEventListener(
  "DOMMouseScroll",
  mouseConstraint.mouse.mousewheel
);

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// keep the mouse in sync with rendering
// render.mouse = mouse;

for (var i = 0; i < 80; i++) {
  blob = softBody(
    container.clientWidth / 2,
    container.clientHeight / 2,
    2,
    3,
    0,
    0,
    true,
    3,
    particleOptions
  );
  Composite.add(engine.world, blob);
}

function handleResize(container) {
  // set canvas size to new values
  render.canvas.width = container.clientWidth;
  render.canvas.height = container.clientHeight;

  Matter.Body.setPosition(
    floor,
    Matter.Vector.create(
      container.clientWidth / 2,
      container.clientHeight + WALL_WIDTH / 2
    )
  );

  Matter.Body.setPosition(
    rightWall,
    Matter.Vector.create(
      container.clientWidth + WALL_WIDTH / 2,
      container.clientHeight / 2
    )
  );
}

window.addEventListener("resize", () => handleResize(container));
