# grover run

`hdqs.grover(3, ['101'], iterations=2, seed=3)` — exported by sia-script 1.5.6 on 2026-11-20T10:54:07Z.

## Files

| file | what it is | provenance |
|---|---|---|
| `player.html` | interactive explanation; edit the inputs and re-run offline | exact |
| `stages.pdf` | one page per stage of the algorithm | derived |
| `summary.png` | slide-ready result image | derived |
| `data.json` | every recorded stage as numbers (story schema) | exact / sampled |
| `circuit.qasm` | OpenQASM 3 program of the executed circuit | derived |
| `circuit.tex` | circuit with labelled sections (quantikz) | derived |
| `experiment.py` | one-line re-run plus the explicit circuit | source |
| `metadata.json` | version, inputs, seed, result, circuit hash, provenance | record |
| `environment.txt` | Python and package versions | record |

## Reproduce

```bash
pip install "sia-script==1.5.6"
python experiment.py
```

Open player.html to step through the stages and try other inputs.

## Provenance

- **exact**: computed from the simulated state, no sampling noise.
- **sampled**: drawn with the recorded seed; the same seed and version give the same numbers.
- **derived**: rendered or converted from the exact data (figures, LaTeX, QASM).

## Cite

Generated with sia-script 1.5.6 (hdqs engine), 2026-11-20T10:54:07Z. Circuit fingerprint `sha256:a6b7a60833e0940f35150abc55c1fdb903cd34a2f365b706817c2079a5453173`.
