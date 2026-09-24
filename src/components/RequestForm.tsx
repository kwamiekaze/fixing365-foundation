import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Camera, Check, ImagePlus, Loader2, X } from "lucide-react";
import { getService } from "@/config/services";
import { submitContactRequest, type ContactRequest } from "@/lib/requests";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const MAX_PHOTOS = 6;
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const phoneOk = (v: string) => v.replace(/\D/g, "").length >= 10;

/**
 * Single-screen request form: name, phone, email, city or ZIP, details and
 * photos. "Take photo" opens the phone camera directly; "Attach photos"
 * opens the library. A problem picked in the 3D house prefills the details.
 */
export function RequestForm({
  initialCategory = "",
  initialProblem = "",
  bare = false,
}: {
  initialCategory?: string;
  initialProblem?: string;
  /** Inside a pop-up: no card of its own, the pop-up is the card. */
  bare?: boolean;
}) {
  const service = getService(initialCategory);
  const blank = (): ContactRequest => ({
    fullName: "",
    phone: "",
    email: "",
    cityZip: "",
    details: initialProblem ? `${initialProblem}. ` : "",
    category: initialCategory,
    photos: [],
  });
  const [data, setData] = useState<ContactRequest>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactRequest, string>>>({});
  const [sending, setSending] = useState(false);
  const [ref, setRef] = useState("");
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const previews = useMemo(
    () => data.photos.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [data.photos],
  );
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const set = (key: keyof ContactRequest) => (e: { target: { value: string } }) =>
    setData((d) => ({ ...d, [key]: e.target.value }));
  const addPhotos = (list: FileList | null) => {
    if (!list) return;
    const images = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setData((d) => ({ ...d, photos: [...d.photos, ...images].slice(0, MAX_PHOTOS) }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (data.fullName.trim().length < 2) next.fullName = "Enter your full name.";
    if (!phoneOk(data.phone)) next.phone = "Enter a phone number we can reach you on.";
    if (!emailOk(data.email)) next.email = "Enter a valid email address.";
    if (data.cityZip.trim().length < 3) next.cityZip = "Enter your city or ZIP code.";
    if (data.details.trim().length < 10)
      next.details = "Tell us a little more about what’s broken.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSending(true);
    const result = await submitContactRequest(data);
    setRef(result.id);
    setSending(false);
  };

  if (ref)
    return (
      <div className="mx-auto max-w-xl rounded-md border border-success/30 bg-success/10 p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success text-background">
          <Check />
        </span>
        <h2 className="mt-5 font-display text-3xl font-bold">
          Thanks, {data.fullName.split(" ")[0]}.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Reference {ref}. We’ll match your request with the right provider and reach out by phone
          or email.
        </p>
        <Button
          className="mt-7"
          variant="outline"
          onClick={() => {
            setData(blank());
            setRef("");
          }}
        >
          Send another request
        </Button>
      </div>
    );

  const field = (key: keyof ContactRequest, label: string, input: React.ReactNode) => (
    <div>
      <Label htmlFor={`rf-${key}`}>{label}</Label>
      <div className="mt-2">{input}</div>
      {errors[key] && (
        <p className="mt-1.5 text-xs font-semibold text-destructive">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={submit}
      noValidate
      className={
        bare
          ? "grid gap-5"
          : "mx-auto grid max-w-2xl gap-5 rounded-lg border border-border bg-panel p-5 md:p-8"
      }
    >
      {service && <p className="text-sm font-bold text-primary">{service.name}</p>}
      <div className="grid gap-5 md:grid-cols-2">
        {field(
          "fullName",
          "Full name",
          <Input
            id="rf-fullName"
            autoComplete="name"
            value={data.fullName}
            onChange={set("fullName")}
          />,
        )}
        {field(
          "phone",
          "Phone number",
          <Input
            id="rf-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={data.phone}
            onChange={set("phone")}
          />,
        )}
        {field(
          "email",
          "Email",
          <Input
            id="rf-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={data.email}
            onChange={set("email")}
          />,
        )}
        {field(
          "cityZip",
          "City or ZIP code",
          <Input
            id="rf-cityZip"
            autoComplete="postal-code"
            value={data.cityZip}
            onChange={set("cityZip")}
          />,
        )}
      </div>
      {field(
        "details",
        "What’s broken?",
        <Textarea
          id="rf-details"
          rows={5}
          placeholder="What’s happening, where it is, and when it started."
          value={data.details}
          onChange={set("details")}
        />,
      )}
      <div>
        <p className="text-sm font-medium">Photos</p>
        <p className="mt-1 text-xs text-muted-foreground">
          A clear photo helps providers quote faster. Up to {MAX_PHOTOS}.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="hero" onClick={() => cameraInput.current?.click()}>
            <Camera /> Take photo
          </Button>
          <Button type="button" variant="outline" onClick={() => libraryInput.current?.click()}>
            <ImagePlus /> Attach photos
          </Button>
          <input
            ref={cameraInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              addPhotos(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={libraryInput}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addPhotos(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        {previews.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-6">
            {previews.map(({ file, url }, i) => (
              <li
                key={url}
                className="relative aspect-square overflow-hidden rounded-md border border-border"
              >
                <img src={url} alt={file.name} className="size-full object-cover" />
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    setData((d) => ({ ...d, photos: d.photos.filter((_, j) => j !== i) }))
                  }
                  className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-background/80"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button
        type="submit"
        variant="hero"
        size="lg"
        disabled={sending}
        className="w-full md:w-auto md:justify-self-start"
      >
        {sending ? <Loader2 className="animate-spin" /> : <Camera />}
        {sending ? "Sending" : "Send my request"}
      </Button>
    </form>
  );
}
