import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export default function AddProductButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<"coffee bean" | "coffee" | "drink">("drink");
  const labels = cat === "drink" ? ["Small", "Medium", "Large"] : ["250g", "500g", "1000g"];
  const [prices, setPrices] = useState<Record<string, string>>({ Small: "", Medium: "", Large: "" });
  const [images, setImages] = useState<string[]>([]);
  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const urls = Array.from(e.target.files || []).slice(0,3).map(f=>URL.createObjectURL(f));
    setImages(urls);
  }
  function onCat(val: "coffee bean" | "coffee" | "drink") {
    setCat(val);
    const next: Record<string,string> = {} as any;
    (val === "drink" ? ["Small","Medium","Large"] : ["250g","500g","1000g"]).forEach(l=>next[l]="");
    setPrices(next);
  }
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    alert("Product submitted");
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Product</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>Provide details and pricing. Images are optional (max 3).</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label>Images</Label>
            <Input type="file" accept="image/*" multiple onChange={onPick} />
            {images.length>0 && (
              <div className="flex gap-2 mt-1">
                {images.map((src,i)=>(
                  <img key={i} src={src} alt="preview" className="h-16 w-16 object-cover rounded-md border" />
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Product Name</Label>
            <Input value={name} onChange={(e)=>setName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea value={desc} onChange={(e)=>setDesc(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <select className="border rounded-md h-9 px-3 text-sm" value={cat} onChange={(e)=>onCat(e.target.value as any)}>
              <option value="coffee bean">Coffee Bean</option>
              <option value="coffee">Coffee</option>
              <option value="drink">Drink</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Price Categories</Label>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="text-left p-2">Variant</th>
                    <th className="text-left p-2">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {labels.map((vl) => (
                    <tr key={vl} className="border-t">
                      <td className="p-2">{vl}</td>
                      <td className="p-2">
                        <Input type="number" min="0" step="0.01" value={prices[vl] ?? ""} onChange={(e)=>setPrices(prev=>({ ...prev, [vl]: e.target.value }))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button type="submit">Save Product</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
