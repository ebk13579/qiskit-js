/**
 * @license
 *
 * Copyright (c) 2017, IBM.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in
 * the LICENSE.txt file in the root directory of this source tree.
 */

'use strict';

const assert = require('assert');

const { Circuit, Gate } = require('../..');

const circuit = new Circuit();
const circuitMulti = new Circuit({ nQubits: 2 });

circuit.addGate(Gate.h, 0, 0);
circuitMulti.addGate(Gate.h, 0, 0).addGate(Gate.cx, 1, [0, 1]);

function checkValid(circ) {
  assert.equal(circ.nQubits, 1);
  assert.deepEqual(circ.customGates, {});
  assert.equal(circ.gates.length, 1);
  assert.equal(circ.gates[0].length, 1);
  assert.equal(typeof circ.gates[0][0].id, 'string');
  assert.ok(circ.gates[0][0].id.length > 16);
  assert.equal(circ.gates[0][0].name, 'h');
  assert.equal(circ.gates[0][0].connector, 0);
}

describe('sim:Circuit:addGate', () => {
  it('should modify the circuit for a valid gate', () => checkValid(circuit));

  it('should auto-increase the "nQubits" property if needed', () => {
    const circuitOther = new Circuit();

    circuitOther.addGate('h', 0, 0);
    circuitOther.addGate(Gate.cx, 1, [0, 1]);

    assert.equal(circuitOther.nQubits, 2);
  });
});

describe('sim:Circuit:run', () => {
  it('should change the internal state for a single gate circuit', () => {
    const input = [false];
    circuit.run(input);

    assert.deepEqual(circuit.state, [
      { re: 0.7071067811865475, im: 0 },
      { re: 0.7071067811865475, im: 0 },
    ]);
  });

  it('should change the internal state for a multi gate circuit', () => {
    const input = [false, false];
    circuitMulti.run(input);

    assert.deepEqual(circuitMulti.state, [
      { re: 0.7071067811865475, im: 0 },
      { re: 0, im: 0 },
      { re: 0, im: 0 },
      { re: 0.7071067811865475, im: 0 },
    ]);
  });

  it('should be possible execute the same circuit twice in a row', () => {
    const expectedState = [
      { re: 0.9999999999999998, im: 0 },
      { re: 0, im: 0 }
    ];

    const twoGates = Circuit.createCircuit(1);
    twoGates.addGate(Gate.h, 0, 0).addGate(Gate.h, 1, 0).run();
    assert.deepEqual(twoGates.state, expectedState);

    const runTwice = Circuit.createCircuit(1);
    runTwice.addGate(Gate.h, 0, 0);
    runTwice.run();
    runTwice.run();
    assert.deepEqual(runTwice.state, expectedState);
  });
});

describe('sim:Circuit:stateToString', () => {
  it('should return human readable string for a single gate circuit', () =>
    assert.deepEqual(
      circuit.stateToString(),
      '0.70710678+0i|0>50%\n0.70710678+0i|1>50%',
    ));

  it('should a human readable string for a multi gate circuit', () => {
    assert.deepEqual(
      circuitMulti.stateToString(),
      '0.70710678+0i|00>50%\n0+0i|01>0%\n0+0i|10>0%\n0.70710678+0i|11>50%',
    );
  });
});

let saved;
describe('sim:Circuit:save', () => {
  it('should save the circuit structure for a future use', () => {
    saved = circuit.save();

    checkValid(saved);
  });
});

describe('sim:Circuit:load', () => {
  it('should load a saved circuit', () => {
    const circuitOther = new Circuit();
    circuitOther.load(saved);

    checkValid(circuitOther);
  });
});

describe('sim:Circuit:createCircuit', () => {
  it('should be able create Circuit using factory function', () => {
    const c = Circuit.createCircuit(2);
    assert.equal(c.nQubits, 2);
  });

  it('should throw a TypeError if qubit argument is not a number', () => {
    assert.throws(() => {
      Circuit.createCircuit('a');
      },
      {
        name: 'TypeError',
        message: 'The "qubits" argument must be of type number. Received string'
      }
    );
  });

  it('should throw an error if qubit argument is undefined', () => {
    assert.throws(() => {
      Circuit.createCircuit();
    });
  });
});
