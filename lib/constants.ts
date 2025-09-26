interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "UGX", name: "Uganda Shillings", symbol: "UGX" },
];
