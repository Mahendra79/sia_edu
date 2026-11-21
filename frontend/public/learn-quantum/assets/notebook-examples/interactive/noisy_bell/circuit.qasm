// omitted (no OpenQASM 3 form): noise channel 'depolarizing'
OPENQASM 3.0;
include "stdgates.inc";
qubit[2] q;
h q[0];
cx q[0], q[1];
