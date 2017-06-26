function Rubik(element) {

  // set cubes charackeristics
  var dimensions = 3;
  background = 0x00000000;
  var width = element.innerWidth(),
      height = element.innerHeight();

  // set scene
  var scene = new THREE.Scene();
  // set camera
  var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  var renderer = new THREE.WebGLRenderer({ antialias: true });


  
  renderer.setClearColor(background, 1.0);
  renderer.setSize(width, height);
  element.append(renderer.domElement);

  // set camera position
  camera.position = new THREE.Vector3(-20, 10, 10);
  camera.lookAt(scene.position);
  THREE.Object3D._threexDomEvent.camera(camera);

  // set light
  scene.add(new THREE.AmbientLight(0xffffff));

  // set camera controls
  var orbitControl = new THREE.OrbitControls(camera, renderer.domElement);


  // enable / disable camera control when drag cube
  function enableCameraControl() {
    orbitControl.noRotate = false;
  }
  function disableCameraControl() {
    orbitControl.noRotate = true;
  }

  // create a cubes
  var colours = [0x00549D00, 0x00F3F3F3, 0x00F6813D, 0x000070E8, 0x0000B4F5, 0x002F42DC],
      faceMaterials = colours.map(function(c) {
        return new THREE.MeshLambertMaterial({ color: c , ambient: c });
      }),
      cubeMaterials = new THREE.MeshFaceMaterial(faceMaterials);

  var cubeSize = 3,
      spacing = 0.1;

  var increment = cubeSize + spacing,
      maxExtent = (cubeSize * dimensions + spacing * (dimensions - 1)) / 2, 
      allCubes = [];

  function newCube(x, y, z) {
    var cubeGeometry = new THREE.CubeGeometry(cubeSize, cubeSize, cubeSize);
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterials);

    cube.position = new THREE.Vector3(x, y, z);
    cube.rubikPosition = cube.position.clone();

    cube.on('mousedown', function(e) {
      onCubeMouseDown(e, cube);
    });

    cube.on('mouseup', function(e) {
      onCubeMouseUp(e, cube);
    });

    cube.on('mouseout', function(e) {
      onCubeMouseOut(e, cube);
    });

    scene.add(cube);
    allCubes.push(cube);
  }

  var positionOffset = (dimensions - 1) / 2;
  for(var i = 0; i < dimensions; i ++) {
    for(var j = 0; j < dimensions; j ++) {
      for(var k = 0; k < dimensions; k ++) {

        var x = (i - positionOffset) * increment,
            y = (j - positionOffset) * increment,
            z = (k - positionOffset) * increment;

        newCube(x, y, z);
      }
    }
  }


  
  // set constants for mouse events
  var SCREEN_HEIGHT = window.innerHeight;
  var SCREEN_WIDTH = window.innerWidth;
  var raycaster = new THREE.Raycaster(),
      projector = new THREE.Projector();

  // check mouse position
  function isMouseOverCube(mouseX, mouseY) {
    var directionVector = new THREE.Vector3();

    // normalise mouse x and y
    var x = ( mouseX / SCREEN_WIDTH ) * 2 - 1;
    var y = -( mouseY / SCREEN_HEIGHT ) * 2 + 1;

    directionVector.set(x, y, 1);

    projector.unprojectVector(directionVector, camera);
    directionVector.sub(camera.position);
    directionVector.normalize();
    raycaster.set(camera.position, directionVector);

    return raycaster.intersectObjects(allCubes, true).length > 0;
  }

  // return the axis which has the greatest maginitude for the vector v
  function principalComponent(v) {
    var maxAxis = 'x',
        max = Math.abs(v.x);
    if(Math.abs(v.y) > max) {
      maxAxis = 'y';
      max = Math.abs(v.y);
    }
    if(Math.abs(v.z) > max) {
      maxAxis = 'z';
      max = Math.abs(v.z);
    }
    return maxAxis;
  }

  // for each mouse down, track the position of the cube that
  // we clicked (clickVector) and the face object that we clicked on 
  // (clickFace)
  var clickVector, clickFace;

  // keep track of the last cube that the user's drag exited, so we can make
  // valid movements that end outside of the Rubik's cube
  var lastCube;

  var onCubeMouseDown = function(e, cube) {
    disableCameraControl();

    //Maybe add move check in here
    if(true || !isMoving) {
      clickVector = cube.rubikPosition.clone();
      
      var centroid = e.targetFace.centroid.clone();
      centroid.applyMatrix4(cube.matrixWorld);

      //Which face (of the overall cube) did we click on?
      if(nearlyEqual(Math.abs(centroid.x), maxExtent))
        clickFace = 'x';
      else if(nearlyEqual(Math.abs(centroid.y), maxExtent))
        clickFace = 'y';
      else if(nearlyEqual(Math.abs(centroid.z), maxExtent))
        clickFace = 'z';    
    }  
  };

  var transitions = {
    'x': {'y': 'z', 'z': 'y'},
    'y': {'x': 'z', 'z': 'x'},
    'z': {'x': 'y', 'y': 'x'}
  }

  var onCubeMouseUp = function(e, cube) {

    if(clickVector) {
      var dragVector = cube.rubikPosition.clone();
      dragVector.sub(clickVector);

      if(dragVector.length() > cubeSize) {

        var dragVectorOtherAxes = dragVector.clone();
        dragVectorOtherAxes[clickFace] = 0;

        var maxAxis = principalComponent(dragVectorOtherAxes);

        var rotateAxis = transitions[clickFace][maxAxis],
            direction = dragVector[maxAxis] >= 0 ? 1 : -1;
        
        if(clickFace == 'z' && rotateAxis == 'x' || 
           clickFace == 'x' && rotateAxis == 'z' ||
           clickFace == 'y' && rotateAxis == 'z')
          direction *= -1;

        if(clickFace == 'x' && clickVector.x > 0 ||
           clickFace == 'y' && clickVector.y < 0 ||
           clickFace == 'z' && clickVector.z < 0)
          direction *= -1;

        pushMove(cube, clickVector.clone(), rotateAxis, direction);
        startNextMove();
        enableCameraControl();
      }
    }
  };

  var onCubeMouseOut = function(e, cube) {
    lastCube = cube;
  }

  element.on('mouseup', function(e) {
    if(!isMouseOverCube(e.clientX, e.clientY)) {
      if(lastCube)
        onCubeMouseUp(e, lastCube);
    }
  });

  // set transition rules
  var moveEvents = $({});

  var moveQueue = [],
      completedMoveStack = [],
      currentMove;

  var isMoving = false,
      moveAxis, moveN, moveDirection,
      rotationSpeed = 0.2;

  var pivot = new THREE.Object3D(),
      activeGroup = [];

  function nearlyEqual(a, b, d) {
    d = d || 0.001;
    return Math.abs(a - b) <= d;
  }

  function setActiveGroup(axis) {
    if(clickVector) {
      activeGroup = [];

      allCubes.forEach(function(cube) {
        if(nearlyEqual(cube.rubikPosition[axis], clickVector[axis])) { 
          activeGroup.push(cube);
        }
      });
    } 
  }

  var pushMove = function(cube, clickVector, axis, direction) {
    moveQueue.push({ cube: cube, vector: clickVector, axis: axis, direction: direction });
  }

  var startNextMove = function() {
    var nextMove = moveQueue.pop();

    if(nextMove) {
      clickVector = nextMove.vector;
      
      var direction = nextMove.direction || 1,
          axis = nextMove.axis;

      if(clickVector) {

        if(!isMoving) {
          isMoving = true;
          moveAxis = axis;
          moveDirection = direction;

          setActiveGroup(axis);

          pivot.rotation.set(0,0,0);
          pivot.updateMatrixWorld();
          scene.add(pivot);

          activeGroup.forEach(function(e) {
            THREE.SceneUtils.attach(e, scene, pivot);
          });

          currentMove = nextMove;
        }
      }
    } else {
      moveEvents.trigger('deplete');
    }
  }

  function doMove() {
    if(pivot.rotation[moveAxis] >= Math.PI / 2) {
      pivot.rotation[moveAxis] = Math.PI / 2;
      moveComplete();
    } else if(pivot.rotation[moveAxis] <= Math.PI / -2) {
      pivot.rotation[moveAxis] = Math.PI / -2;
      moveComplete()
    } else {
      pivot.rotation[moveAxis] += (moveDirection * rotationSpeed);
    }
  }

  var moveComplete = function() {
    isMoving = false;
    moveAxis, moveN, moveDirection = undefined;
    clickVector = undefined;

    pivot.updateMatrixWorld();
    scene.remove(pivot);
    activeGroup.forEach(function(cube) {
      cube.updateMatrixWorld();

      cube.rubikPosition = cube.position.clone();
      cube.rubikPosition.applyMatrix4(pivot.matrixWorld);

      THREE.SceneUtils.detach(cube, pivot, scene);
    });

    completedMoveStack.push(currentMove);

    moveEvents.trigger('complete');

    startNextMove();
  }


  function render() {

    //States
    if(isMoving) {
      doMove();
    } 

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();
}

