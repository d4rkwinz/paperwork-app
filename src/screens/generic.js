import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as DATA from "../data";
import { NotFound, PrimaryButton, ReviewBlock, SecondaryButton } from "../ui";
import styles from "../styles";

// Tier B generic renderers. Deliberately SPARSELY addressed - the opposite
// of every Tier A screen: a route emits a testID on at most two elements,
// the primary action button (`${cfg.testPrefix}-primary`) and the list
// container (`${cfg.testPrefix}-list`). Every other element - list rows,
// secondary buttons, detail values, form inputs - carries only an
// accessibilityLabel, so the crawler must find it via text, the
// accessibility tree, or vision. Do NOT add row/input testIDs here: that
// would silently turn the scale tier into a second intelligence tier and
// make the two scores measure the same thing.
//
// Each renderer takes the uniform ({ nav, params, app, cfg }) signature,
// where cfg is a BULK[routeName] entry (shape documented above BULK in
// src/data.js). Task 12 wires each Tier B route as a named wrapper so
// App.js's ROUTES keeps bare identifiers and scripts/data.test.js can
// resolve `export function <Component>`:
//   export function PoliciesScreen(props) {
//     return <ListScreen {...props} cfg={BULK.Policies} />;
//   }
//
// None of these renderers writes to app state or to seed collections -
// they read DATA[cfg.collection] and navigate. All nav targets are dynamic
// (from cfg), so scripts/data.test.js's literal string-target nav scan has
// nothing to match in this file; Tier B edges are declared from BULK.
//
// All conditionals use ?: or !! (never {value && ...}): Tier B data
// includes numeric fields, and a falsy-and renders a bare 0 outside <Text>,
// which hard-crashes React Native.

// Shared field renderer for form and wizard steps. No testID by design;
// the label is the input's only address.
function FieldList({ fields, values, onChange }) {
  return (
    <>
      {fields.map((field) => (
        <React.Fragment key={field.key}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            accessibilityLabel={field.label}
            style={field.multiline ? styles.input : styles.singleInput}
            placeholder={field.placeholder}
            multiline={!!field.multiline}
            value={values[field.key] ? values[field.key] : ""}
            onChangeText={(text) => onChange(field.key, text)}
          />
        </React.Fragment>
      ))}
    </>
  );
}

function requiredComplete(fields, values) {
  return fields.every((field) =>
    field.required ? String(values[field.key] ? values[field.key] : "").trim().length > 0 : true
  );
}

export function ListScreen({ nav, params, app, cfg }) {
  return (
    <ScrollView
      testID={`${cfg.testPrefix}-list`}
      accessibilityLabel={cfg.heading}
      contentContainerStyle={styles.scroll}
    >
      <Text style={styles.kicker}>{cfg.title}</Text>
      <Text style={styles.h1}>{cfg.heading}</Text>
      {DATA[cfg.collection].map((item) => (
        <Pressable
          key={String(item.id)}
          accessibilityRole="button"
          accessibilityLabel={String(cfg.itemLabel(item))}
          onPress={() => nav.push(cfg.itemRoute, { [cfg.itemParam]: item.id })}
          style={styles.requestCard}
        >
          <View>
            <Text style={styles.cardTitle}>{String(cfg.itemLabel(item))}</Text>
            {cfg.itemSub ? <Text style={styles.cardBody}>{String(cfg.itemSub(item))}</Text> : null}
          </View>
          <Text style={styles.chevron}>{">"}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function DetailScreen({ nav, params, app, cfg }) {
  const id = params ? params[cfg.param] : undefined;
  const item = DATA[cfg.collection].find((entry) => entry.id === id);

  if (!item) {
    return <NotFound label={cfg.label} nav={nav} />;
  }

  const actions = cfg.actions ? cfg.actions : [];
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>{cfg.title ? cfg.title : cfg.label}</Text>
      <Text style={styles.h1}>{String(item[cfg.titleField])}</Text>
      <ReviewBlock rows={cfg.rows.map(([label, field]) => [label, String(item[field])])} />
      {actions.map((action, index) =>
        index === 0 ? (
          <PrimaryButton
            key={action.label}
            label={action.label}
            testID={`${cfg.testPrefix}-primary`}
            onPress={() => nav.push(action.route, { [cfg.param]: id, ...action.params })}
          />
        ) : (
          <SecondaryButton
            key={action.label}
            label={action.label}
            onPress={() => nav.push(action.route, { [cfg.param]: id, ...action.params })}
          />
        )
      )}
    </ScrollView>
  );
}

export function FormScreen({ nav, params, app, cfg }) {
  const [values, setValues] = useState({});
  const setField = (key, text) => setValues((current) => ({ ...current, [key]: text }));
  const complete = requiredComplete(cfg.fields, values);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>{cfg.title}</Text>
      <Text style={styles.h1}>{cfg.heading}</Text>
      <FieldList fields={cfg.fields} values={values} onChange={setField} />
      <PrimaryButton
        label={cfg.submitLabel}
        testID={`${cfg.testPrefix}-primary`}
        disabled={!complete}
        onPress={() => nav.push(cfg.nextRoute)}
      />
    </ScrollView>
  );
}

// Bounded by construction: params.step must be an integer in
// [1, cfg.steps.length] or the screen renders NotFound instead of a step -
// a missing, non-numeric, or out-of-range step can never loop or crash, so
// the wizard chain terminates after exactly cfg.steps.length pushes.
export function WizardScreen({ nav, params, app, cfg }) {
  const [values, setValues] = useState({});
  const step = params ? Number(params.step) : NaN;

  if (!Number.isInteger(step) || step < 1 || step > cfg.steps.length) {
    return <NotFound label={cfg.label} nav={nav} />;
  }

  const current = cfg.steps[step - 1];
  const last = step === cfg.steps.length;
  const setField = (key, text) => setValues((state) => ({ ...state, [key]: text }));

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>{`${cfg.title} - step ${step} of ${cfg.steps.length}`}</Text>
      <Text style={styles.h1}>{current.heading}</Text>
      <FieldList fields={current.fields} values={values} onChange={setField} />
      <PrimaryButton
        label={last ? cfg.submitLabel : "Next"}
        testID={`${cfg.testPrefix}-primary`}
        onPress={() => (last ? nav.push(cfg.nextRoute) : nav.push(cfg.route, { step: step + 1 }))}
      />
    </ScrollView>
  );
}
