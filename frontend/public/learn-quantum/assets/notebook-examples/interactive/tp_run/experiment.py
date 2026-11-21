from sia import hdqs

# 1) one line: re-run teleport with the same inputs
r = hdqs.teleport(seed=2)
print({k: v for k, v in r.items() if not k.startswith("_")})

# 2) the same circuit written out gate by gate
# teleport: the circuit of this run

q = (hdqs(3)
     # state to send
     .ry(0, 0.7).rz(0, 0.3)
     # Bell pair
     .h(1).cx(1, 2)
     # Alice
     .cx(0, 1).h(0).measure(0, key="m0").measure(1, key="m1")
     # Bob corrects
     .if_x("m1", 2).if_z("m0", 2)
)
print(q.records)
