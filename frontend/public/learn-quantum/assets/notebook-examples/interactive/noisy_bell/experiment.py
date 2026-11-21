from sia import hdqs

# the circuit of this register
K2 = [[[0.9219544457292888, 0], [0, 0.9219544457292888]], [[0, 0.22360679774997896], [0.22360679774997896, 0]], [[0, complex(0, -0.22360679774997896)], [complex(0, 0.22360679774997896), 0]], [[0.22360679774997896, 0], [0, -0.22360679774997896]]]   # noise channel as Kraus operators

q = (hdqs.dm(2, seed=3)
     .h(0).cx(0, 1).kraus(K2, [0])
)
print(q.sample(1000))

# the bundle's figure and data:
# q.draw("c,b,p,d", "figure.pdf", preset="paper")
# q.export_bundle("noisy_bell")
