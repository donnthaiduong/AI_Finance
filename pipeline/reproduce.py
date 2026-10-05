"""Run a gated inherited pilot into a fresh folder without promoting its snapshot."""
import datetime as dt, hashlib, json, pathlib, subprocess, sys
from audit import audit, ROOT

def run():
    integrity=audit()
    if integrity['errors']: raise ValueError(integrity['errors'])
    run_id=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    output=ROOT/'outputs/research-runs'/run_id
    output.mkdir(parents=True)
    import train
    train.OUTPUT=output
    train.train()
    inherited=json.loads((ROOT/'data/model-report.json').read_text(encoding='utf8'))
    observed=json.loads((output/'model-report.json').read_text(encoding='utf8'))
    comparison={'selectionMatchesInherited':observed['selected']==inherited['selected'],
                'testMetricsMatchInherited':observed['test']==inherited['test']}
    manifest={'runId':run_id,'executedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
              'status':'observed-local-reproduction','dataset':integrity,
              'trainSha256':hashlib.sha256((ROOT/'pipeline/train.py').read_bytes()).hexdigest(),
              'python':sys.version,'comparison':comparison,'selected':observed['selected'],
              'limitations':observed['limitations'],'promotion':'Not promoted to product snapshot'}
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
    print(json.dumps({'output':str(output),'comparison':comparison}))
    return output

if __name__=='__main__':run()
