"use client"

import * as React from "react"
import { Sparkles, Loader2, ChevronDown, ChevronUp, FlaskConical, Lightbulb } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useSessionStore } from "@/stores/sessionStore"

interface AIPanelProps {
  readonly sessionId: string
}

export function AIPanel({ sessionId }: AIPanelProps) {
  const [activeTab, setActiveTab] = React.useState("hypotheses")

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="grid grid-cols-2 mx-3 mt-3">
          <TabsTrigger value="hypotheses" className="gap-1">
            <Lightbulb className="h-4 w-4" />
            Hypotheses
          </TabsTrigger>
          <TabsTrigger value="variants" className="gap-1">
            <FlaskConical className="h-4 w-4" />
            Variants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hypotheses" className="flex-1 overflow-hidden m-0">
          <HypothesesTab sessionId={sessionId} />
        </TabsContent>

        <TabsContent value="variants" className="flex-1 overflow-hidden m-0">
          <VariantRankingTab sessionId={sessionId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function HypothesesTab({ sessionId }: { readonly sessionId: string }) {
  const [researchGoal, setResearchGoal] = React.useState("")
  const [focusArea, setFocusArea] = React.useState("")
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const { hypotheses, isLoading, generateHypotheses } = useSessionStore()

  const handleGenerate = async () => {
    if (!researchGoal.trim()) return
    await generateHypotheses(sessionId, researchGoal, focusArea || undefined)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-3 border-b">
        <div className="space-y-2">
          <Label>Research Goal</Label>
          <Textarea
            placeholder="Describe your research goal..."
            value={researchGoal}
            onChange={(e) => setResearchGoal(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Focus Area (optional)</Label>
          <Input
            placeholder="e.g., protein stability"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
          />
        </div>
        <Button onClick={handleGenerate} disabled={isLoading || !researchGoal.trim()} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Hypotheses
            </>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {hypotheses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hypotheses generated yet</p>
              <p className="text-sm">Enter a research goal and click generate</p>
            </div>
          ) : (
            hypotheses.map((hypothesis) => (
              <Card key={hypothesis.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {hypothesis.statement}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpandedId(expandedId === hypothesis.id ? null : hypothesis.id)}
                    >
                      {expandedId === hypothesis.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <ScoreBadge label="Feasibility" score={hypothesis.feasibility_score} />
                    <ScoreBadge label="Evidence" score={hypothesis.evidence_score} />
                    <ScoreBadge label="Novelty" score={hypothesis.novelty_score} />
                  </div>
                </CardHeader>

                {expandedId === hypothesis.id && (
                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Rationale
                      </p>
                      <p className="text-sm">{hypothesis.rationale}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Experimental Approach
                      </p>
                      <p className="text-sm">{hypothesis.experimental_approach}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Expected Outcomes
                      </p>
                      <ul className="text-sm list-disc list-inside">
                        {hypothesis.expected_outcomes.map((outcome, i) => (
                          <li key={i}>{outcome}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function VariantRankingTab({ sessionId }: { readonly sessionId: string }) {
  const [sequences, setSequences] = React.useState("")
  const [targetProperty, setTargetProperty] = React.useState("")

  const { rankedVariants, isLoading, rankVariants } = useSessionStore()

  const handleRank = async () => {
    if (!sequences.trim() || !targetProperty.trim()) return

    const seqList = sequences.split("\n").filter(Boolean).map((seq, i) => ({
      sequence: seq.trim(),
      name: `Variant ${i + 1}`,
    }))

    await rankVariants(sessionId, seqList, targetProperty)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-3 border-b">
        <div className="space-y-2">
          <Label>Sequences (one per line)</Label>
          <Textarea
            placeholder="MVLSPADKTN...&#10;MVLSPADKTA...&#10;MVLSPADKTG..."
            value={sequences}
            onChange={(e) => setSequences(e.target.value)}
            rows={4}
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label>Target Property</Label>
          <Input
            placeholder="e.g., thermostability"
            value={targetProperty}
            onChange={(e) => setTargetProperty(e.target.value)}
          />
        </div>
        <Button
          onClick={handleRank}
          disabled={isLoading || !sequences.trim() || !targetProperty.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ranking...
            </>
          ) : (
            <>
              <FlaskConical className="mr-2 h-4 w-4" />
              Rank Variants
            </>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {rankedVariants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No variants ranked yet</p>
              <p className="text-sm">Enter sequences and a target property</p>
            </div>
          ) : (
            rankedVariants.map((variant, index) => (
              <Card key={variant.sequence.id || index}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">#{index + 1}</span>
                      <CardTitle className="text-sm">{variant.sequence.name}</CardTitle>
                    </div>
                    <Badge
                      variant={
                        variant.recommended_priority === "high"
                          ? "default"
                          : variant.recommended_priority === "medium"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {variant.recommended_priority}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-xs truncate">
                    {variant.sequence.sequence}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Success Score</span>
                      <span className="font-medium">{Math.round(variant.success_score * 100)}%</span>
                    </div>
                    <Progress value={variant.success_score * 100} />
                    <div className="flex items-center justify-between text-sm">
                      <span>Confidence</span>
                      <span className="font-medium">{Math.round(variant.confidence * 100)}%</span>
                    </div>
                    <Progress value={variant.confidence * 100} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function ScoreBadge({ label, score }: { readonly label: string; readonly score: number }) {
  const percentage = Math.round(score * 100)
  const variant = percentage >= 70 ? "default" : percentage >= 40 ? "secondary" : "outline"

  return (
    <Badge variant={variant} className="text-xs">
      {label}: {percentage}%
    </Badge>
  )
}
