import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts if needed, else we can use standard fonts like Helvetica
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf', fontWeight: 700 }
  ]
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
    color: '#1e293b'
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  },
  scoreBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 10,
    color: '#0f172a'
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center'
  },
  categoryName: {
    flex: 1,
    fontSize: 12,
    fontWeight: 600,
    color: '#334155'
  },
  categoryScore: {
    width: 60,
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'right'
  },
  progressBarContainer: {
    flex: 2,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 10
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingLeft: 10
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#64748b'
  },
  breakdownScore: {
    fontSize: 10,
    fontWeight: 600,
    color: '#475569'
  },
  suggestionBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b'
  },
  suggestionText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 1.4
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10
  }
});

const getScoreColor = (score) => {
  if (score >= 80) return '#22c55e'; // Green
  if (score >= 60) return '#eab308'; // Yellow
  return '#ef4444'; // Red
};

const getCategoryColor = (name) => {
  const map = {
    'Contact Completeness': '#6366f1',
    'Section Completeness': '#a855f7',
    'Content Quality': '#22d3ee',
    'Keyword & Skills': '#22c55e',
    'Formatting Quality': '#f59e0b',
  };
  return map[name] || '#94a3b8';
};

// Create Document Component
const PDFReport = ({ analysis, resume }) => {
  const keywordCat = analysis?.categories?.find((c) => c.category === 'Keyword & Skills');
  
  // ALL_KEYWORDS for missing skills
  const ALL_KEYWORDS = [
    'agile', 'scrum', 'full stack', 'front end', 'back end', 'cloud', 'devops',
    'ci cd', 'microservices', 'api', 'rest', 'database', 'machine learning',
    'data analysis', 'software development', 'system design', 'leadership',
    'team player', 'communication', 'problem solving', 'collaboration',
  ];
  const foundKeywords = keywordCat?.foundKeywords || [];
  const missingKeywords = ALL_KEYWORDS.filter(
    (kw) => !foundKeywords.some((f) => f.toLowerCase().includes(kw.replace(/\s/g, '').slice(0, 6)))
  ).slice(0, 10);

  const scoreColor = getScoreColor(analysis?.totalScore || 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>ATS Analysis Report</Text>
            <Text style={styles.subtitle}>Resume: {resume?.originalName || 'Untitled'}</Text>
            <Text style={styles.subtitle}>Date: {new Date().toLocaleDateString()}</Text>
          </View>
          <View style={[styles.scoreBadgeContainer, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>{analysis?.totalScore}</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <Text style={styles.sectionTitle}>Score Breakdown</Text>
        {analysis?.categories?.map((cat, i) => {
          const catColor = getCategoryColor(cat.category);
          return (
            <View key={i} style={{ marginBottom: 12 }}>
              <View style={styles.categoryRow}>
                <Text style={styles.categoryName}>{cat.category}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${cat.percentage}%`, backgroundColor: catColor }]} />
                </View>
                <Text style={[styles.categoryScore, { color: catColor }]}>{cat.score} / {cat.weight}</Text>
              </View>
              {cat.breakdown?.map((item, j) => (
                <View key={j} style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>{item.label}</Text>
                  <Text style={styles.breakdownScore}>{item.score}/{item.max}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* Keywords & Skills */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Skills & Keywords Analysis</Text>
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Detected Technical Skills ({keywordCat?.detectedSkills?.length || 0})</Text>
          <View style={styles.pillContainer}>
            {keywordCat?.detectedSkills?.map((skill, i) => (
              <Text key={i} style={[styles.pill, { backgroundColor: '#cffafe', color: '#0891b2' }]}>{skill}</Text>
            ))}
          </View>
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Found Industry Keywords ({foundKeywords?.length || 0})</Text>
          <View style={styles.pillContainer}>
            {foundKeywords?.map((kw, i) => (
              <Text key={i} style={[styles.pill, { backgroundColor: '#dcfce7', color: '#166534' }]}>{kw}</Text>
            ))}
          </View>
        </View>

        {missingKeywords.length > 0 && (
          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Missing Keywords (Consider Adding)</Text>
            <View style={styles.pillContainer}>
              {missingKeywords.map((kw, i) => (
                <Text key={i} style={[styles.pill, { backgroundColor: '#fee2e2', color: '#991b1b', borderWidth: 1, borderColor: '#fca5a5' }]}>{kw}</Text>
              ))}
            </View>
          </View>
        )}
        
        {/* Footer */}
        <Text style={styles.footer} fixed>
          Generated by AI Resume Analyzer
        </Text>
      </Page>

      {/* Page 2: Suggestions */}
      {analysis?.suggestions?.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Actionable Suggestions</Text>
          <Text style={[styles.subtitle, { marginBottom: 20 }]}>Improve your resume with these AI-driven tips</Text>
          
          {analysis.suggestions.map((suggestion, i) => (
            <View key={i} style={styles.suggestionBox}>
              <Text style={{ fontSize: 12, fontWeight: 600, color: '#b45309', marginBottom: 4 }}>Suggestion {i + 1}</Text>
              <Text style={styles.suggestionText}>{suggestion.tip}</Text>
            </View>
          ))}
          
          {/* Footer */}
          <Text style={styles.footer} fixed>
            Generated by AI Resume Analyzer
          </Text>
        </Page>
      )}
    </Document>
  );
};

export default PDFReport;
