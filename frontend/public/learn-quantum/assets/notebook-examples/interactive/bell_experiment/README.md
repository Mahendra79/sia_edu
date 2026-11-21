# bell_experiment

A 2-qubit hdqs register (3 operations), exported by sia-script 1.5.6 on 2026-11-20T10:54:05Z. Simulation mode: statevector; seed: 42.

## Files

| file | what it is | provenance |
|---|---|---|
| `figure.pdf` | publication figure (double column, vector) | derived |
| `figure.svg` | the same figure as editable SVG | derived |
| `figure.caption.txt` | suggested caption | derived |
| `data.json` | state, probabilities, Bloch vectors, entanglement (schema sia.views.v1) | exact |
| `data.csv` | amplitudes and probabilities per basis state | exact |
| `circuit.qasm` | OpenQASM 3 program | derived |
| `circuit.tex` | circuit diagram for LaTeX (quantikz, compiles standalone) | derived |
| `experiment.py` | the hdqs program that rebuilds this register | source |
| `explorer.html` | offline interactive explorer (open in any browser) | exact |
| `metadata.json` | version, seed, shots, mode, circuit hash, provenance | record |
| `environment.txt` | Python and package versions | record |

## Reproduce

```bash
pip install "sia-script==1.5.6"
python experiment.py
```

experiment.py rebuilds the register and prints a sample.

## Provenance

- **exact**: computed from the simulated state, no sampling noise.
- **sampled**: drawn with the recorded seed; the same seed and version give the same numbers.
- **derived**: rendered or converted from the exact data (figures, LaTeX, QASM).

## Cite

Generated with sia-script 1.5.6 (hdqs engine), 2026-11-20T10:54:05Z. Circuit fingerprint `sha256:c2c00f156f3d0278b32f822cf4bebd707dab37c8d57864c40c4124156101eac7`.
