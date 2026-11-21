# teleport run

`hdqs.teleport(seed=2)` — exported by sia-script 1.5.6 on 2026-11-20T10:54:14Z.

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

Generated with sia-script 1.5.6 (hdqs engine), 2026-11-20T10:54:14Z. Circuit fingerprint `sha256:57c2297531398bcad3649c6e385a3e62a6087e54da1c026d40848e5e55f706f3`.
