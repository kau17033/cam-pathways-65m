import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
import prepare_dataset as prep
import utils
class Contract(unittest.TestCase):
    def test_abstention(self):
        row={"i":1,"c":"C","g":"beauty","p":[1000,100,None,200,20,10],"miss":["shipping"],"expected":"HOLD"}
        doc=prep.convert(row)
        self.assertIsNone(doc["expected_verdict"])
        self.assertEqual(doc["expected_status"],"INCOMPLETE")
        old={"subset":"partial","expected_verdict":"HOLD","target":"CAM verdict: HOLD — missing: shipping","missing_items":"shipping"}
        complete=utils._migrate_complete({"subset":"complete","expected_verdict":"TEST_CANDIDATE"})
        self.assertEqual(complete["stock"],1)
        self.assertIn("stock: 1",utils.doc_to_text({**complete,**{"price":2000,"cost":100,"shipping":100,"fee":100,"returnReserve":100,"otherVariable":100,"targetProfit":800,"deliveryDays":4,"maxDeliveryDays":10,"estimateAgeDays":5,"maxEstimateAgeDays":30}}))
        new=utils._migrate_partial(old)
        self.assertEqual((new["expected_verdict"],new["target"]),(None,doc["target"]))
        self.assertEqual(utils.process_results_partial(new,[new["target"]])["verdict_accuracy"],1)
        self.assertEqual(utils.process_results_partial(new,["CAM verdict: HOLD — missing: shipping"])["verdict_accuracy"],0)
        self.assertEqual(utils.process_results_partial(new,[new["target"]+"\nCAM verdict: HOLD — missing: shipping"])["verdict_accuracy"],0)
        self.assertEqual(utils.process_results_partial(new,[new["target"]])["line_exact_match"],1)
    def test_full_dataset(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/"export.jsonl"
            subprocess.run([sys.executable,str(ROOT/"prepare_dataset.py"),"--src",str(ROOT.parent/"tasks-dense.jsonl"),"--out",str(out)],check=True)
            v2=[json.loads(x) for x in out.read_text().splitlines()]
            legacy=[json.loads(x) for x in (ROOT/"data"/"cam_product_viability.jsonl").read_text().splitlines()]
            self.assertEqual((len(v2),sum(x["subset"]=="partial" for x in v2),sum(x["subset"]=="complete" for x in v2)),(9993,1500,8493))
            for old,new in zip(legacy,v2):
                self.assertEqual(old["id"],new["id"])
                if old["subset"]=="partial":
                    self.assertEqual(utils._migrate_partial(old)["target"],new["target"])
                    self.assertIsNone(new["expected_verdict"])
                else:
                    self.assertEqual(new["stock"],1)
                    self.assertEqual(old["target"],new["target"])
                    self.assertEqual(old["expected_verdict"],new["expected_verdict"])
                    profit=new["price"]-sum(new[k] for k in ("cost","shipping","fee","returnReserve","otherVariable"))
                    predicted=("REJECT" if profit<=0 else "HOLD" if profit<new["targetProfit"] or new["deliveryDays"]>new["maxDeliveryDays"] or new["estimateAgeDays"]>new["maxEstimateAgeDays"] else "TEST_CANDIDATE")
                    self.assertEqual(new["expected_verdict"],predicted, "v2 synthetic fixture and legacy label must agree")
if __name__=="__main__":unittest.main()
