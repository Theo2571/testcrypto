// @ts-nocheck
import React from "react";
import TokenCard from "../../components/TokenCard/TokenCard";

const TokenList = ({ tokens }) => {
  return (
    <div
      className="mobile-list"
      style={{ display: "none", flexDirection: "column", gap: 12 }}
    >
      {tokens.map((t, i) => (
        <TokenCard key={i} token={t} />
      ))}
    </div>
  );
};

export default TokenList;
