import React from "react";
import { size, text, weight } from "../tokens";
import { Card } from "../primitives/Card";
import { Placeholder } from "../primitives/Placeholder";
import { Eyebrow } from "../primitives/SpecChip";

export interface Post { kind: string; title: string; dek: string; meta: string }

export const JournalCard: React.FC<Post> = ({ kind, title, dek, meta }) => (
  <Card interactive style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
    <Placeholder flush height={128} />
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
      <Eyebrow>{kind}</Eyebrow>
      <div style={{ fontSize: size.base, fontWeight: weight.medium, lineHeight: 1.35 }}>{title}</div>
      <div style={{ fontSize: size.sm, color: text.secondary, lineHeight: 1.5 }}>{dek}</div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: size.xs, color: text.tertiary }}>{meta}</div>
    </div>
  </Card>
);

export const JournalGrid: React.FC<{ posts: Post[] }> = ({ posts }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
    {posts.map(p => <JournalCard key={p.title} {...p} />)}
  </div>
);
