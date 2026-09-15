import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import { useLang } from '../i18n/i18n';

/**
 * Generic searchable dropdown.
 * Props:
 *  - label: field label
 *  - value: currently selected item (object) or null
 *  - items: array of { id, label }
 *  - onSelect(item): called with the chosen item
 *  - allowOther: if true, shows an "Other" row that calls onOther()
 *  - onOther(): called when user picks "Other"
 *  - disabled: read-only display mode (used for auto-fetched Zamindar)
 *  - placeholder
 */
export default function SearchableDropdown({
  label, value, items, onSelect, allowOther, onOther, disabled, placeholder, onClear
}) {
  const { t, fontFamily, isRTL } = useLang();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { fontFamily: fontFamily('medium') }]}>{label}</Text>
      ) : null}

      <View style={styles.fieldRow}>
        <TouchableOpacity
          style={[styles.field, { flex: 1 }, disabled && styles.fieldDisabled]}
          disabled={disabled}
          onPress={() => setOpen(true)}
        >
          <Text
            style={[
              styles.fieldText,
              { fontFamily: fontFamily('regular'), textAlign: isRTL ? 'right' : 'left' },
              !value && styles.placeholderText
            ]}
          >
            {value ? value.label : placeholder || t('search')}
          </Text>
        </TouchableOpacity>
        {onClear && value ? (
          <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <TextInput
              style={[styles.searchInput, { fontFamily: fontFamily('regular') }]}
              placeholder={t('search')}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              ListEmptyComponent={
                <Text style={[styles.empty, { fontFamily: fontFamily('regular') }]}>{t('noResults')}</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    onSelect(item);
                    setQuery('');
                    setOpen(false);
                  }}
                >
                  <Text style={{ fontFamily: fontFamily('regular') }}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            {allowOther ? (
              <TouchableOpacity
                style={styles.otherRow}
                onPress={() => {
                  setOpen(false);
                  setQuery('');
                  onOther && onOther();
                }}
              >
                <Text style={[styles.otherText, { fontFamily: fontFamily('medium') }]}>{t('other')}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={{ color: colors.navy, fontFamily: fontFamily('medium') }}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { color: colors.textPrimary, marginBottom: spacing.xs, fontSize: 13 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  clearBtn: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: colors.danger, fontWeight: '700' },
  field: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, backgroundColor: colors.card
  },
  fieldDisabled: { backgroundColor: colors.background },
  fieldText: { color: colors.textPrimary },
  placeholderText: { color: colors.textSecondary },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(11,37,69,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, maxHeight: '75%'
  },
  searchInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, marginBottom: spacing.md
  },
  row: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  otherRow: { paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xs },
  otherText: { color: colors.green },
  closeBtn: { alignItems: 'center', paddingVertical: spacing.md },
  empty: { textAlign: 'center', color: colors.textSecondary, paddingVertical: spacing.lg }
});
