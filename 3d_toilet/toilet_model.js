/**
 * 3D Porcelain Toilet Model Generator & Stylized 3D Character Generator
 */

function createToilet3DModel(porcelainMat, chromeMat) {
  const toiletGroup = new THREE.Group();
  const porcelainMeshes = [];

  const drainPipeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#020617'),
    roughness: 0.8
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#00d2ff'),
    opacity: 0.75,
    transparent: true,
    roughness: 0.05,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  // 1. Pedestal Base & Outer Shell
  const bowlGroup = new THREE.Group();

  const baseGeo = new THREE.CylinderGeometry(1.6, 2.0, 2.5, 32);
  const baseMesh = new THREE.Mesh(baseGeo, porcelainMat);
  baseMesh.position.set(0, 1.25, 0.2);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  bowlGroup.add(baseMesh);
  porcelainMeshes.push(baseMesh);

  const backBaseGeo = new THREE.BoxGeometry(3.6, 3.8, 2.2);
  const backBaseMesh = new THREE.Mesh(backBaseGeo, porcelainMat);
  backBaseMesh.position.set(0, 1.9, -1.8);
  backBaseMesh.castShadow = true;
  backBaseMesh.receiveShadow = true;
  bowlGroup.add(backBaseMesh);
  porcelainMeshes.push(backBaseMesh);

  const outerBowlGeo = new THREE.CylinderGeometry(2.4, 1.8, 2.2, 32, 1, true);
  const outerBowlMesh = new THREE.Mesh(outerBowlGeo, porcelainMat);
  outerBowlMesh.position.set(0, 3.1, 0.5);
  outerBowlMesh.scale.set(1.0, 1.0, 1.25);
  outerBowlMesh.castShadow = true;
  bowlGroup.add(outerBowlMesh);
  porcelainMeshes.push(outerBowlMesh);

  // 2. Hollow Inner Bowl Cavity & Drain Hole
  const innerCavityGeo = new THREE.CylinderGeometry(2.1, 0.9, 2.0, 32, 1, true);
  const innerCavityMesh = new THREE.Mesh(innerCavityGeo, porcelainMat);
  innerCavityMesh.position.set(0, 3.1, 0.5);
  innerCavityMesh.scale.set(1.0, 1.0, 1.22);
  innerCavityMesh.material.side = THREE.DoubleSide;
  innerCavityMesh.receiveShadow = true;
  bowlGroup.add(innerCavityMesh);
  porcelainMeshes.push(innerCavityMesh);

  const drainHoleGeo = new THREE.CylinderGeometry(0.85, 0.6, 1.5, 32);
  const drainHoleMesh = new THREE.Mesh(drainHoleGeo, drainPipeMat);
  drainHoleMesh.position.set(0, 1.85, 0.3);
  bowlGroup.add(drainHoleMesh);

  const rimGeo = new THREE.TorusGeometry(2.1, 0.3, 16, 32);
  const rimMesh = new THREE.Mesh(rimGeo, porcelainMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.set(0, 4.15, 0.5);
  rimMesh.scale.set(1.0, 1.25, 1.0);
  rimMesh.castShadow = true;
  bowlGroup.add(rimMesh);
  porcelainMeshes.push(rimMesh);

  toiletGroup.add(bowlGroup);

  // 3. Water Tank & Lid
  const tankGroup = new THREE.Group();

  const tankGeo = new THREE.BoxGeometry(4.2, 4.5, 2.2);
  const tankMesh = new THREE.Mesh(tankGeo, porcelainMat);
  tankMesh.position.set(0, 5.75, -1.8);
  tankMesh.castShadow = true;
  tankMesh.receiveShadow = true;
  tankGroup.add(tankMesh);
  porcelainMeshes.push(tankMesh);

  const tankLidGeo = new THREE.BoxGeometry(4.4, 0.5, 2.4);
  const tankLidMesh = new THREE.Mesh(tankLidGeo, porcelainMat);
  tankLidMesh.position.set(0, 8.25, -1.8);
  tankLidMesh.castShadow = true;
  tankGroup.add(tankLidMesh);
  porcelainMeshes.push(tankLidMesh);

  toiletGroup.add(tankGroup);

  // 4. Flush Lever / Handle
  const leverGroup = new THREE.Group();
  leverGroup.position.set(-2.2, 7.2, -1.2);

  const leverBaseGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.4, 16);
  const leverBaseMesh = new THREE.Mesh(leverBaseGeo, chromeMat);
  leverBaseMesh.rotation.z = Math.PI / 2;
  leverGroup.add(leverBaseMesh);

  const leverArmGeo = new THREE.BoxGeometry(0.15, 1.1, 0.3);
  const leverArmMesh = new THREE.Mesh(leverArmGeo, chromeMat);
  leverArmMesh.position.set(-0.25, -0.4, 0);
  leverGroup.add(leverArmMesh);

  toiletGroup.add(leverGroup);

  // 5. Chrome Hinge Bar
  const hingeGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.6, 16);
  const hingeMesh = new THREE.Mesh(hingeGeo, chromeMat);
  hingeMesh.rotation.z = Math.PI / 2;
  hingeMesh.position.set(0, 4.25, -0.8);
  toiletGroup.add(hingeMesh);

  // 6. Toilet Seat Ring
  const seatGroup = new THREE.Group();
  seatGroup.position.set(0, 4.25, -0.8);

  const seatRingGeo = new THREE.TorusGeometry(2.05, 0.26, 16, 32);
  const seatRingMesh = new THREE.Mesh(seatRingGeo, porcelainMat);
  seatRingMesh.rotation.x = Math.PI / 2;
  seatRingMesh.position.set(0, 0, 1.3);
  seatRingMesh.scale.set(1.0, 1.25, 1.0);
  seatRingMesh.castShadow = true;
  seatGroup.add(seatRingMesh);
  porcelainMeshes.push(seatRingMesh);

  toiletGroup.add(seatGroup);

  // 7. Toilet Cover Lid
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, 4.4, -0.8);

  const lidPlateGeo = new THREE.CylinderGeometry(2.35, 2.35, 0.25, 32);
  const lidPlateMesh = new THREE.Mesh(lidPlateGeo, porcelainMat);
  lidPlateMesh.position.set(0, 0.12, 1.3);
  lidPlateMesh.scale.set(1.0, 1.0, 1.28);
  lidPlateMesh.castShadow = true;
  lidGroup.add(lidPlateMesh);
  porcelainMeshes.push(lidPlateMesh);

  toiletGroup.add(lidGroup);

  // 8. Water Surface & Swirl Vortex Mesh
  const waterGroup = new THREE.Group();
  waterGroup.position.set(0, 2.6, 0.4);

  const waterSurfaceGeo = new THREE.CircleGeometry(1.35, 32);
  const waterSurfaceMesh = new THREE.Mesh(waterSurfaceGeo, glassMat);
  waterSurfaceMesh.rotation.x = -Math.PI / 2;
  waterSurfaceMesh.scale.set(1.0, 1.22, 1.0);
  waterGroup.add(waterSurfaceMesh);

  const swirlGeo = new THREE.ConeGeometry(1.2, 1.4, 24, 1, true);
  const swirlMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#38bdf8'),
    opacity: 0.75,
    transparent: true,
    roughness: 0.1,
    wireframe: true,
    side: THREE.DoubleSide
  });
  const swirlMesh = new THREE.Mesh(swirlGeo, swirlMat);
  swirlMesh.rotation.x = Math.PI;
  swirlMesh.position.set(0, -0.6, 0);
  swirlMesh.visible = false;
  waterGroup.add(swirlMesh);

  toiletGroup.add(waterGroup);

  return {
    group: toiletGroup,
    porcelainMeshes: porcelainMeshes,
    lidGroup: lidGroup,
    seatGroup: seatGroup,
    leverGroup: leverGroup,
    waterGroup: waterGroup,
    waterSurfaceMesh: waterSurfaceMesh,
    swirlMesh: swirlMesh
  };
}

/**
 * 3D Stylized Person Character Generator (Head, Torso, Limbs)
 */
function createPerson3DModel() {
  const personGroup = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: '#fde047', roughness: 0.5 }); // Yellowish emoji character skin
  const shirtMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 }); // Blue shirt
  const pantsMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 }); // Dark pants

  // Head
  const headGeo = new THREE.SphereGeometry(0.7, 24, 24);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.set(0, 3.2, 0);
  headMesh.castShadow = true;
  personGroup.add(headMesh);

  // Torso / Shirt
  const torsoGeo = new THREE.CylinderGeometry(0.7, 0.6, 1.6, 16);
  const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
  torsoMesh.position.set(0, 2.0, 0);
  torsoMesh.castShadow = true;
  personGroup.add(torsoMesh);

  // Left Arm Group (Pivot at shoulder)
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.85, 2.6, 0);
  const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.3), skinMat);
  leftArmMesh.position.set(0, -0.65, 0);
  leftArmMesh.castShadow = true;
  leftArmGroup.add(leftArmMesh);
  personGroup.add(leftArmGroup);

  // Right Arm Group (Pivot at shoulder)
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.85, 2.6, 0);
  const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.3), skinMat);
  rightArmMesh.position.set(0, -0.65, 0);
  rightArmMesh.castShadow = true;
  rightArmGroup.add(rightArmMesh);
  personGroup.add(rightArmGroup);

  // Left Leg Group (Pivot at hip)
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.35, 1.2, 0);
  const leftLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 1.4), pantsMat);
  leftLegMesh.position.set(0, -0.7, 0);
  leftLegMesh.castShadow = true;
  leftLegGroup.add(leftLegMesh);
  personGroup.add(leftLegGroup);

  // Right Leg Group (Pivot at hip)
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.35, 1.2, 0);
  const rightLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 1.4), pantsMat);
  rightLegMesh.position.set(0, -0.7, 0);
  rightLegMesh.castShadow = true;
  rightLegGroup.add(rightLegMesh);
  personGroup.add(rightLegGroup);

  personGroup.position.set(10, 0, 0.5); // Start off screen
  personGroup.visible = false;

  return {
    group: personGroup,
    leftArmGroup: leftArmGroup,
    rightArmGroup: rightArmGroup,
    leftLegGroup: leftLegGroup,
    rightLegGroup: rightLegGroup
  };
}
