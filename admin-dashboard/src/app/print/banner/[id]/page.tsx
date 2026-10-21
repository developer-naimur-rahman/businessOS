"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../../lib/api-client"
import { DesignState, defaultDesignState } from "../../../../components/design-studio/types"
import { DesignCanvas } from "../../../../components/design-studio/primitives"
import { TEMPLATES } from "../../../../components/design-studio/TemplateRegistry"

export default function BannerPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const [state, setState] = useState<DesignState | null>(null)
  
  // Use React.use to unwrap the params promise
  const resolvedParams = React.use(params)

  useEffect(() => {
    fetchDesign()
  }, [resolvedParams.id])

  const fetchDesign = async () => {
    try {
      const res = await api.get('/design-studio/designs')
      const design = res.data.find((x: any) => x.id === resolvedParams.id)

      
      if (design && design.settings && design.settings.version) {
        setState({
          ...defaultDesignState,
          ...design.settings,
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (!state) return <div>Loading print preview...</div>

  const TemplateComponent = TEMPLATES[state.templateId]?.component || TEMPLATES['StandardListTemplate'].component

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: ${state.width}in ${state.height}in;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          background-color: ${state.colors.background};
        }
      `}} />
      <DesignCanvas state={state} isPrintMode={true}>
         <TemplateComponent state={state} />
      </DesignCanvas>
    </>
  )
}
