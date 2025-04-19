import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import useSWR from "swr";

const fetcher = (url, token) =>
  fetch(url, {
    headers: {
      Authorization: `Token ${token}`,
    },
  }).then((r) => (r.ok ? r.json() : Promise.reject(r)));

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="select-none cursor-move">
      {children}
    </div>
  );
}

export default function WorkflowDesigner() {
  const token = localStorage.getItem("authToken");
  const { data: templates } = useSWR(["/api/forms/templates", token], fetcher);
  const { data: units } = useSWR(["/api/organization/units", token], fetcher);
  const { data: workflows, mutate } = useSWR(["/api/form-approval-workflows/", token], fetcher);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [items, setItems] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formState, setFormState] = useState({ unit: "", role: "staff" });

  // sensors for DnD
  const sensors = useSensors(useSensor(PointerSensor));

  // Whenever template or workflows data change, update items
  useEffect(() => {
    if (!selectedTemplate || !workflows) return;
    const filtered = workflows.filter((w) => w.form_template === selectedTemplate.id).sort((a, b) => a.order - b.order);
    setItems(filtered);
  }, [selectedTemplate, workflows]);

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const newItems = arrayMove(items, oldIdx, newIdx).map((item, idx) => ({ ...item, order: idx }));
    setItems(newItems);

    // Persist order changes (optimistic)
    try {
      await Promise.all(
        newItems.map((item) =>
          fetch(`/api/form-approval-workflows/${item.id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
            body: JSON.stringify({ order: item.order }),
          })
        )
      );
      mutate();
    } catch (err) {
      toast.error("Error saving order");
    }
  };

  const addStep = async () => {
    if (!selectedTemplate) return;
    try {
      await fetch("/api/form-approval-workflows/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        body: JSON.stringify({
          form_template: selectedTemplate.id,
          unit: formState.unit,
          approver_role: formState.role,
          order: items.length,
        }),
      });
      toast.success("Step added");
      setShowDialog(false);
      setFormState({ unit: "", role: "staff" });
      mutate();
    } catch (err) {
      toast.error("Failed to add step");
    }
  };

  const deleteStep = async (id) => {
    try {
      await fetch(`/api/form-approval-workflows/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      mutate();
    } catch {
      toast.error("Failed to delete step");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Workflow Designer</h1>
      <Select value={selectedTemplate?.id} onValueChange={(val) => setSelectedTemplate(templates.find((t) => t.id.toString() === val))}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select Form Template" />
        </SelectTrigger>
        <SelectContent>
          {templates?.map((t) => (
            <SelectItem key={t.id} value={t.id.toString()}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTemplate && (
        <Card className="w-full">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Steps for "{selectedTemplate.name}"</h2>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Step
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((step) => (
                  <SortableItem key={step.id} id={step.id}>
                    <div className="flex items-center justify-between rounded-lg bg-muted/20 p-3 mb-2">
                      <div>
                        <p className="font-medium">
                          {step.order + 1}. Unit #{step.unit} – {step.approver_role}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteStep(step.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}

      {/* Add Step Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Workflow Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={formState.unit} onValueChange={(val) => setFormState({ ...formState, unit: val })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent>
                {units?.map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={formState.role} onValueChange={(val) => setFormState({ ...formState, role: val })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={addStep}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
