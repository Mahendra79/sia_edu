OPENQASM 3.0;
include "stdgates.inc";
qubit[3] q;
bit[1] m0;
bit[1] m1;
ry(0.69999999999999996) q[0];
rz(0.29999999999999999) q[0];
h q[1];
cx q[1],q[2];
cx q[0],q[1];
h q[0];
m0[0] = measure q[0];
m1[0] = measure q[1];
if (m1[0] == 1) { x q[2]; }
if (m0[0] == 1) { z q[2]; }
