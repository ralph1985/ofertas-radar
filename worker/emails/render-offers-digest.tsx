import * as React from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text, render, toPlainText } from "react-email";

export type DigestOffer = {
  title: string;
  retailer: string;
  price: string;
  unitPrice: string;
  size: string | null;
  quantity: number | null;
  reason: string;
  url: string;
};

export type DigestGroup = {
  searchTitle: string;
  offers: DigestOffer[];
};

export type OffersDigestProps = {
  groups: DigestGroup[];
  generatedAt: Date;
};

const colors = {
  ink: "#172033",
  muted: "#667085",
  line: "#dfe7e2",
  canvas: "#f4f7f4",
  panel: "#ffffff",
  accent: "#176b4d",
  accentSoft: "#e6f2eb",
};

export function OffersDigestEmail({ groups, generatedAt }: OffersDigestProps) {
  const totalOffers = groups.reduce((total, group) => total + group.offers.length, 0);
  const preview = `${totalOffers} ${totalOffers === 1 ? "oferta nueva" : "ofertas nuevas"} que encajan con tus búsquedas`;
  const date = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Madrid" }).format(generatedAt);

  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "32px 12px", backgroundColor: colors.canvas, fontFamily: "Arial, Helvetica, sans-serif", color: colors.ink }}>
        <Container style={{ maxWidth: "680px", margin: "0 auto" }}>
          <Section style={{ padding: "8px 8px 22px" }}>
            <Text style={{ margin: 0, color: colors.accent, fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>OFERTAS RADAR</Text>
            <Heading as="h1" style={{ margin: "12px 0 8px", color: colors.ink, fontSize: "30px", lineHeight: "1.15", letterSpacing: "-0.5px" }}>Lo que merece la pena revisar</Heading>
            <Text style={{ margin: 0, color: colors.muted, fontSize: "14px", lineHeight: "1.6" }}>{preview}. Revisión del {date}.</Text>
          </Section>

          {groups.map((group) => (
            <Section key={group.searchTitle} style={{ marginBottom: "20px", padding: "20px", backgroundColor: colors.panel, border: `1px solid ${colors.line}`, borderRadius: "14px" }}>
              <Text style={{ margin: "0 0 14px", color: colors.accent, fontSize: "12px", fontWeight: "700", letterSpacing: "0.4px", textTransform: "uppercase" }}>BÚSQUEDA</Text>
              <Heading as="h2" style={{ margin: "0 0 18px", color: colors.ink, fontSize: "20px", lineHeight: "1.3" }}>{group.searchTitle}</Heading>
              {group.offers.map((offer, index) => (
                <React.Fragment key={`${offer.url}-${index}`}>
                  {index > 0 && <Hr style={{ margin: "22px 0", borderColor: colors.line }} />}
                  <Section>
                    <Text style={{ margin: "0 0 8px", color: colors.ink, fontSize: "17px", fontWeight: "700", lineHeight: "1.35" }}>{offer.title}</Text>
                    <Text style={{ margin: "0 0 10px", color: colors.muted, fontSize: "13px", lineHeight: "1.5" }}>
                      <strong style={{ color: colors.ink, fontSize: "20px" }}>{offer.price}</strong>{offer.unitPrice !== "Consultar" ? ` · ${offer.unitPrice}/ud.` : ""} · {offer.retailer}
                    </Text>
                    <Text style={{ display: "inline-block", margin: "0 0 12px", padding: "5px 9px", backgroundColor: colors.accentSoft, borderRadius: "999px", color: colors.accent, fontSize: "12px", fontWeight: "700" }}>
                      {[offer.size, offer.quantity === null ? null : `${offer.quantity} uds.`].filter(Boolean).join(" · ") || "Oferta verificada"}
                    </Text>
                    <Text style={{ margin: "0 0 16px", color: colors.muted, fontSize: "14px", lineHeight: "1.6" }}>{offer.reason}</Text>
                    <Button href={offer.url} style={{ display: "inline-block", padding: "11px 16px", backgroundColor: colors.accent, borderRadius: "8px", color: "#ffffff", fontSize: "13px", fontWeight: "700", textDecoration: "none" }}>Ver oferta</Button>
                    <Text style={{ margin: "12px 0 0", fontSize: "12px", lineHeight: "1.4" }}><Link href={offer.url} style={{ color: colors.muted, wordBreak: "break-all" }}>Abrir enlace directo</Link></Text>
                  </Section>
                </React.Fragment>
              ))}
            </Section>
          ))}

          <Section style={{ padding: "8px", textAlign: "center" }}>
            <Hr style={{ margin: "0 0 18px", borderColor: colors.line }} />
            <Text style={{ margin: 0, color: colors.muted, fontSize: "12px", lineHeight: "1.6" }}>Comprueba el precio, la disponibilidad y las condiciones de envío antes de comprar. Este radar no realiza compras.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderOffersDigest(props: OffersDigestProps) {
  const html = await render(<OffersDigestEmail {...props} />);
  return { html, text: toPlainText(html) };
}
