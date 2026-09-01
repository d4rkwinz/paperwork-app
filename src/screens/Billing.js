import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { INVOICES } from "../data";
import { NotFound, PrimaryButton, ReviewBlock, ToggleRow } from "../ui";
import { cardValid } from "../validate";
import styles from "../styles";

// All conditionals in this file use ?: (never {value && ...}): seeded
// INV-2405 has amount: 0 and INV-2408 has status: "", and a falsy-and there
// renders a bare 0 / "" outside <Text>, which hard-crashes React Native.

function amountText(amount) {
  return amount === 0 ? "No charge" : `$${amount.toFixed(2)}`;
}

// 4th tab root. Owns invoices and documents; tapping an invoice starts the
// deepest chain in the app (Billing -> PaymentReview -> PaymentResult).
export function BillingScreen({ nav, params, app }) {
  const [showDocuments, setShowDocuments] = useState(false);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Billing</Text>
      <Text style={styles.h1}>Invoices and payments</Text>
      <Pressable
        testID="open-payment-methods"
        accessibilityRole="button"
        accessibilityLabel="Open payment methods"
        onPress={() => nav.push("PaymentMethods")}
        style={styles.settingRow}
      >
        <View>
          <Text style={styles.cardTitle}>Payment methods</Text>
          <Text style={styles.cardBody}>{`${app.paymentMethods.length} saved cards`}</Text>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </Pressable>
      <Pressable
        testID="open-documents"
        accessibilityRole="button"
        accessibilityLabel="Show billing documents"
        accessibilityState={{ expanded: showDocuments }}
        onPress={() => setShowDocuments((current) => !current)}
        style={styles.settingRow}
      >
        <View>
          <Text style={styles.cardTitle}>Documents</Text>
          <Text style={styles.cardBody}>Statements and tax receipts</Text>
        </View>
        <Text style={styles.chevron}>{showDocuments ? "v" : ">"}</Text>
      </Pressable>
      {showDocuments ? (
        <View testID="billing-documents" style={styles.inlinePanel}>
          <Text style={styles.panelTitle}>April statement</Text>
          <Text style={styles.bodyText}>12 invoices, 4 open.</Text>
          <Text style={styles.panelTitle}>2025 tax receipt</Text>
          <Text style={styles.bodyText}>Issued Jan 15 for deductible services.</Text>
        </View>
      ) : null}
      <Text style={styles.sectionTitle}>Invoices</Text>
      {INVOICES.map((invoice) => (
        <Pressable
          key={invoice.id}
          testID={`billing-invoice-${invoice.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Open invoice ${invoice.id}`}
          onPress={() => nav.push("PaymentReview", { invoiceId: invoice.id })}
          style={styles.requestCard}
        >
          <View>
            <Text style={styles.cardEyebrow}>{invoice.id}</Text>
            <Text style={styles.cardTitle}>{invoice.label}</Text>
            <Text style={styles.cardBody}>{amountText(invoice.amount)}</Text>
          </View>
          {invoice.status ? <Text style={styles.status}>{invoice.status}</Text> : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function PaymentMethodsScreen({ nav, params, app }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Billing</Text>
      <Text style={styles.h1}>Payment methods</Text>
      {app.paymentMethods.map((method) => (
        <View key={method.id} testID={`method-${method.id}`} style={styles.listRow}>
          <Text style={styles.reviewLabel}>{method.brand}</Text>
          <Text style={styles.listText}>{`Card ending ${method.last4} - ${method.name}, expires ${method.expiry}`}</Text>
        </View>
      ))}
      <PrimaryButton label="Add a card" testID="add-card" onPress={() => nav.push("AddCard")} />
    </ScrollView>
  );
}

// Trap: format validation, not non-emptiness. card-submit stays disabled
// until cardValid passes: 16 digits (separators ignored), MM/YY with month
// 01-12, exactly 3 CVV digits, non-blank name.
export function AddCardScreen({ nav, params, app }) {
  const [number, setNumber] = useState("");
  const [expiryValue, setExpiryValue] = useState("");
  const [cvvValue, setCvvValue] = useState("");
  const [name, setName] = useState("");
  const valid = cardValid({ number, expiry: expiryValue, cvv: cvvValue, name });

  const saveCard = () => {
    app.setPaymentMethods((current) => [
      ...current,
      {
        id: `pm-${Math.floor(1000 + Math.random() * 9000)}`,
        brand: "Card",
        last4: number.replace(/\D/g, "").slice(-4),
        name: name.trim(),
        expiry: expiryValue.trim()
      }
    ]);
    nav.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Billing</Text>
      <Text style={styles.h1}>Add a card</Text>
      <Text style={styles.bodyText}>
        Save enables once every field is valid: a 16-digit number, MM/YY expiry, 3-digit CVV, and
        the name on the card.
      </Text>
      <Text style={styles.label}>Card number</Text>
      <TextInput
        testID="card-number"
        accessibilityLabel="Card number"
        style={styles.singleInput}
        keyboardType="number-pad"
        placeholder="1234 5678 9012 3456"
        value={number}
        onChangeText={setNumber}
      />
      <Text style={styles.label}>Expiry</Text>
      <TextInput
        testID="card-expiry"
        accessibilityLabel="Card expiry"
        style={styles.singleInput}
        keyboardType="numbers-and-punctuation"
        placeholder="MM/YY"
        value={expiryValue}
        onChangeText={setExpiryValue}
      />
      <Text style={styles.label}>CVV</Text>
      <TextInput
        testID="card-cvv"
        accessibilityLabel="Card security code"
        style={styles.singleInput}
        keyboardType="number-pad"
        placeholder="123"
        secureTextEntry
        value={cvvValue}
        onChangeText={setCvvValue}
      />
      <Text style={styles.label}>Name on card</Text>
      <TextInput
        testID="card-name"
        accessibilityLabel="Name on card"
        style={styles.singleInput}
        autoCapitalize="words"
        placeholder="Alex Morgan"
        value={name}
        onChangeText={setName}
      />
      <PrimaryButton label="Save card" testID="card-submit" disabled={!valid} onPress={saveCard} />
    </ScrollView>
  );
}

// Branch point: the simulate-decline Switch decides which of PaymentResult's
// two terminal states payment-pay produces.
export function PaymentReviewScreen({ nav, params, app }) {
  const [declined, setDeclined] = useState(false);
  const invoice = INVOICES.find((item) => item.id === params.invoiceId);

  if (!invoice) {
    return <NotFound label="Invoice" nav={nav} />;
  }

  const method = app.paymentMethods[0];
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Review payment</Text>
      <Text style={styles.h1}>{invoice.label}</Text>
      <Text testID="payment-amount" accessibilityLabel={`Amount ${amountText(invoice.amount)}`} style={styles.h2}>
        {amountText(invoice.amount)}
      </Text>
      <ReviewBlock
        rows={[
          ["Invoice", invoice.id],
          ["Status", invoice.status ? invoice.status : "Unbilled"],
          ["Pay with", method ? `${method.brand} ending ${method.last4}` : "No saved card"]
        ]}
      />
      <ToggleRow label="Simulate a declined payment" value={declined} onValueChange={setDeclined} testID="simulate-decline" />
      <PrimaryButton
        label="Pay now"
        testID="payment-pay"
        onPress={() => nav.push("PaymentResult", { invoiceId: invoice.id, declined })}
      />
    </ScrollView>
  );
}

// Two mutually exclusive terminal states on one route. payment-result is the
// always-present anchor - it renders unconditionally in both states.
export function PaymentResultScreen({ nav, params, app }) {
  const declined = !!params.declined;
  const invoice = INVOICES.find((item) => item.id === params.invoiceId);
  const label = invoice ? invoice.label : "this invoice";

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text testID="payment-result" style={styles.kicker}>
        Payment result
      </Text>
      {declined ? (
        <View testID="payment-declined" style={styles.inlinePanel}>
          <Text style={styles.h1}>Payment declined</Text>
          <Text style={styles.bodyText}>
            {`Your card was declined for ${label}. No charge was made - review the payment and try again.`}
          </Text>
        </View>
      ) : (
        <View testID="payment-success" style={styles.successPanel}>
          <Text style={styles.h1}>Payment complete</Text>
          <Text style={styles.bodyText}>{`Your payment for ${label} went through. A receipt is on its way.`}</Text>
        </View>
      )}
      {declined ? (
        <PrimaryButton
          label="Try again"
          testID="payment-retry"
          onPress={() => nav.replace("PaymentReview", { invoiceId: params.invoiceId })}
        />
      ) : (
        <PrimaryButton label="Back to billing" testID="payment-done" onPress={() => nav.root("Billing")} />
      )}
    </ScrollView>
  );
}
