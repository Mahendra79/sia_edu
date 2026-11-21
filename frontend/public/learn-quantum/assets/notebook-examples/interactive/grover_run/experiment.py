from sia import hdqs

# 1) one line: re-run grover with the same inputs
r = hdqs.grover(3, ['101'], iterations=2, seed=3)
print({k: v for k, v in r.items() if not k.startswith("_")})

# 2) the same circuit written out gate by gate
# grover: the circuit of this run

q = (hdqs(3)
     # superpose
     .h(0).h(1).h(2)
)
for _ in range(2):
    q = (q
         # oracle
         .x(1).h(2).mcx([0, 1], 2).h(2).x(1)
         # diffuser
         .h(0).h(1).h(2).x(0).x(1).x(2).h(2).mcx([0, 1], 2).h(2).x(0).x(1)
         .x(2).h(0).h(1).h(2)
    )
print(q.sample(1000))
