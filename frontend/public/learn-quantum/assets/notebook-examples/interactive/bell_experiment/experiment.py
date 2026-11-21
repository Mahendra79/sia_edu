from sia import hdqs

# the circuit of this register

q = (hdqs(2, seed=42)
     .h(0).cx(0, 1).ry(1, 0.4)
)
print(q.sample(1000))

# the bundle's figure and data:
# q.draw("c,b,a,e", "figure.pdf", preset="paper")
# q.export_bundle("bell_experiment")
