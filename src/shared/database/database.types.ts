
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "attachments": {
                  Row: {
                    "caption": string | null,"created_at": string,"experiment_id": string | null,"id": string,"kind": string,"owner_id": string,"product_id": string | null,"project_id": string | null,"source_id": string | null,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "caption"?: string | null,"created_at"?: string,"experiment_id"?: string | null,"id"?: string,"kind": string,"owner_id"?: string,"product_id"?: string | null,"project_id"?: string | null,"source_id"?: string | null,"storage_path": string
                  }
                  Update: {
                    "caption"?: string | null,"created_at"?: string,"experiment_id"?: string | null,"id"?: string,"kind"?: string,"owner_id"?: string,"product_id"?: string | null,"project_id"?: string | null,"source_id"?: string | null,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attachments_experiment_id_fkey"
      columns: ["experiment_id"]
isOneToOne: false
      referencedRelation: "experiments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attachments_experiment_id_fkey"
      columns: ["experiment_id"]
isOneToOne: false
      referencedRelation: "v_experiment_summary"
      referencedColumns: ["experiment_id"]
    },{
      foreignKeyName: "attachments_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attachments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "research_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attachments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "v_research_context"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attachments_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "sources"
      referencedColumns: ["id"]
    }
                  ]
                },"experiments": {
                  Row: {
                    "baseline_experiment_id": string | null,"conditions": string | null,"created_at": string,"formulation_id": string,"hypothesis_id": string | null,"id": string,"observations": string | null,"owner_id": string,"performed_on": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "baseline_experiment_id"?: string | null,"conditions"?: string | null,"created_at"?: string,"formulation_id": string,"hypothesis_id"?: string | null,"id"?: string,"observations"?: string | null,"owner_id"?: string,"performed_on"?: string | null,"status"?: string
                  }
                  Update: {
                    "baseline_experiment_id"?: string | null,"conditions"?: string | null,"created_at"?: string,"formulation_id"?: string,"hypothesis_id"?: string | null,"id"?: string,"observations"?: string | null,"owner_id"?: string,"performed_on"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "experiments_baseline_experiment_id_fkey"
      columns: ["baseline_experiment_id"]
isOneToOne: false
      referencedRelation: "experiments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experiments_baseline_experiment_id_fkey"
      columns: ["baseline_experiment_id"]
isOneToOne: false
      referencedRelation: "v_experiment_summary"
      referencedColumns: ["experiment_id"]
    },{
      foreignKeyName: "experiments_formulation_id_fkey"
      columns: ["formulation_id"]
isOneToOne: false
      referencedRelation: "formulations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experiments_formulation_id_fkey"
      columns: ["formulation_id"]
isOneToOne: false
      referencedRelation: "v_formulation_cost"
      referencedColumns: ["formulation_id"]
    },{
      foreignKeyName: "experiments_formulation_id_fkey"
      columns: ["formulation_id"]
isOneToOne: false
      referencedRelation: "v_formulation_nutrition"
      referencedColumns: ["formulation_id"]
    },{
      foreignKeyName: "experiments_formulation_id_fkey"
      columns: ["formulation_id"]
isOneToOne: false
      referencedRelation: "v_sensory_comparison"
      referencedColumns: ["formulation_id"]
    },{
      foreignKeyName: "experiments_hypothesis_id_fkey"
      columns: ["hypothesis_id"]
isOneToOne: false
      referencedRelation: "hypotheses"
      referencedColumns: ["id"]
    }
                  ]
                },"findings": {
                  Row: {
                    "created_at": string,"evidence_level": string,"experiment_id": string | null,"hypothesis_id": string | null,"id": string,"owner_id": string,"project_id": string,"source_id": string | null,"statement": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"evidence_level": string,"experiment_id"?: string | null,"hypothesis_id"?: string | null,"id"?: string,"owner_id"?: string,"project_id": string,"source_id"?: string | null,"statement": string
                  }
                  Update: {
                    "created_at"?: string,"evidence_level"?: string,"experiment_id"?: string | null,"hypothesis_id"?: string | null,"id"?: string,"owner_id"?: string,"project_id"?: string,"source_id"?: string | null,"statement"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "findings_experiment_id_fkey"
      columns: ["experiment_id"]
isOneToOne: false
      referencedRelation: "experiments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "findings_experiment_id_fkey"
      columns: ["experiment_id"]
isOneToOne: false
      referencedRelation: "v_experiment_summary"
      referencedColumns: ["experiment_id"]
    },{
      foreignKeyName: "findings_hypothesis_id_fkey"
      columns: ["hypothesis_id"]
isOneToOne: false
      referencedRelation: "hypotheses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "findings_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "research_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "findings_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "v_research_context"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "findings_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "sources"
      referencedColumns: ["id"]
    }
                  ]
                },"formulation_ingredients": {
                  Row: {
                    "created_at": string,"formulation_id": string,"id": string,"notes": string | null,"owner_id": string,"product_id": string,"quantity": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"formulation_id": string,"id"?: string,"notes"?: string | null,"owner_id"?: string,"product_id": string,"quantity": number
                  }
                  Update: {
                    "created_at"?: string,"formulation_id"?: string,"id"?: string,"notes"?: string | null,"owner_id"?: string,"product_id"?: string,"quantity"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "formulation_ingredients_formulation_id_fkey"
      columns: ["formulation_id"]
isOneToOne: false
      referencedRelation: "formulations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "formulation_ingredients_formulation_id_fkey"
      columns: ["formulation_id"]
isOneToOne: false
      referencedRelation: "v_formulation_cost"
      referencedColumns: ["formulation_id"]
    },{
      foreignKeyName: "formulation_ingredients_formulation_id_fkey"
      columns: ["formulation_id"]
isOneToOne: false
      referencedRelation: "v_formulation_nutrition"
      referencedColumns: ["formulation_id"]
    },{
      foreignKeyName: "formulation_ingredients_formulation_id_fkey"
      columns: ["formulation_id"]
isOneToOne: false
      referencedRelation: "v_sensory_comparison"
      referencedColumns: ["formulation_id"]
    },{
      foreignKeyName: "formulation_ingredients_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"formulations": {
                  Row: {
                    "code": string,"created_at": string,"id": string,"instructions": string | null,"name": string | null,"notes": string | null,"owner_id": string,"parent_id": string | null,"project_id": string,"serving_size": number | null,"serving_unit": string | null,"servings": number | null,"status": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"id"?: string,"instructions"?: string | null,"name"?: string | null,"notes"?: string | null,"owner_id"?: string,"parent_id"?: string | null,"project_id": string,"serving_size"?: number | null,"serving_unit"?: string | null,"servings"?: number | null,"status"?: string,"version"?: number
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"id"?: string,"instructions"?: string | null,"name"?: string | null,"notes"?: string | null,"owner_id"?: string,"parent_id"?: string | null,"project_id"?: string,"serving_size"?: number | null,"serving_unit"?: string | null,"servings"?: number | null,"status"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "formulations_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "formulations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "formulations_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "v_formulation_cost"
      referencedColumns: ["formulation_id"]
    },{
      foreignKeyName: "formulations_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "v_formulation_nutrition"
      referencedColumns: ["formulation_id"]
    },{
      foreignKeyName: "formulations_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "v_sensory_comparison"
      referencedColumns: ["formulation_id"]
    },{
      foreignKeyName: "formulations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "research_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "formulations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "v_research_context"
      referencedColumns: ["project_id"]
    }
                  ]
                },"hypotheses": {
                  Row: {
                    "created_at": string,"id": string,"owner_id": string,"project_id": string,"rationale": string | null,"statement": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"owner_id"?: string,"project_id": string,"rationale"?: string | null,"statement": string,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"owner_id"?: string,"project_id"?: string,"rationale"?: string | null,"statement"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "hypotheses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "research_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hypotheses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "v_research_context"
      referencedColumns: ["project_id"]
    }
                  ]
                },"ingredients": {
                  Row: {
                    "category": string | null,"created_at": string,"id": string,"name": string,"notes": string | null,"owner_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string | null,"created_at"?: string,"id"?: string,"name": string,"notes"?: string | null,"owner_id"?: string
                  }
                  Update: {
                    "category"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"owner_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"product_nutrition": {
                  Row: {
                    "basis_quantity": number,"carbohydrates_g": number | null,"created_at": string,"energy_kcal": number | null,"fat_g": number | null,"fiber_g": number | null,"owner_id": string,"product_id": string,"protein_g": number | null,"saturated_fat_g": number | null,"sodium_mg": number | null,"source_id": string | null,"sugars_g": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "basis_quantity"?: number,"carbohydrates_g"?: number | null,"created_at"?: string,"energy_kcal"?: number | null,"fat_g"?: number | null,"fiber_g"?: number | null,"owner_id"?: string,"product_id": string,"protein_g"?: number | null,"saturated_fat_g"?: number | null,"sodium_mg"?: number | null,"source_id"?: string | null,"sugars_g"?: number | null
                  }
                  Update: {
                    "basis_quantity"?: number,"carbohydrates_g"?: number | null,"created_at"?: string,"energy_kcal"?: number | null,"fat_g"?: number | null,"fiber_g"?: number | null,"owner_id"?: string,"product_id"?: string,"protein_g"?: number | null,"saturated_fat_g"?: number | null,"sodium_mg"?: number | null,"source_id"?: string | null,"sugars_g"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_nutrition_product_id_fkey"
      columns: ["product_id"]
isOneToOne: true
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_nutrition_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "sources"
      referencedColumns: ["id"]
    }
                  ]
                },"product_prices": {
                  Row: {
                    "created_at": string,"currency": string,"id": string,"in_stock": boolean | null,"notes": string | null,"observed_on": string,"owner_id": string,"price": number,"product_id": string,"source_id": string | null,"supplier_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"currency"?: string,"id"?: string,"in_stock"?: boolean | null,"notes"?: string | null,"observed_on"?: string,"owner_id"?: string,"price": number,"product_id": string,"source_id"?: string | null,"supplier_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"currency"?: string,"id"?: string,"in_stock"?: boolean | null,"notes"?: string | null,"observed_on"?: string,"owner_id"?: string,"price"?: number,"product_id"?: string,"source_id"?: string | null,"supplier_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_prices_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_prices_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "sources"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_prices_supplier_id_fkey"
      columns: ["supplier_id"]
isOneToOne: false
      referencedRelation: "suppliers"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "barcode": string | null,"brand": string | null,"created_at": string,"id": string,"ingredient_id": string | null,"name": string,"notes": string | null,"owner_id": string,"package_size": number,"unit": string
                  }
                  ComputedFields: never
                  Insert: {
                    "barcode"?: string | null,"brand"?: string | null,"created_at"?: string,"id"?: string,"ingredient_id"?: string | null,"name": string,"notes"?: string | null,"owner_id"?: string,"package_size": number,"unit": string
                  }
                  Update: {
                    "barcode"?: string | null,"brand"?: string | null,"created_at"?: string,"id"?: string,"ingredient_id"?: string | null,"name"?: string,"notes"?: string | null,"owner_id"?: string,"package_size"?: number,"unit"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"research_projects": {
                  Row: {
                    "created_at": string,"id": string,"objective": string | null,"owner_id": string,"scope": string | null,"status": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"objective"?: string | null,"owner_id"?: string,"scope"?: string | null,"status"?: string,"title": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"objective"?: string | null,"owner_id"?: string,"scope"?: string | null,"status"?: string,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"research_reports": {
                  Row: {
                    "content_md": string,"created_at": string,"id": string,"owner_id": string,"project_id": string,"title": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "content_md": string,"created_at"?: string,"id"?: string,"owner_id"?: string,"project_id": string,"title": string,"version": number
                  }
                  Update: {
                    "content_md"?: string,"created_at"?: string,"id"?: string,"owner_id"?: string,"project_id"?: string,"title"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "research_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "research_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "research_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "v_research_context"
      referencedColumns: ["project_id"]
    }
                  ]
                },"sensory_evaluations": {
                  Row: {
                    "attribute": string,"comment": string | null,"created_at": string,"evaluator": string,"experiment_id": string,"id": string,"owner_id": string,"score": number
                  }
                  ComputedFields: never
                  Insert: {
                    "attribute": string,"comment"?: string | null,"created_at"?: string,"evaluator"?: string,"experiment_id": string,"id"?: string,"owner_id"?: string,"score": number
                  }
                  Update: {
                    "attribute"?: string,"comment"?: string | null,"created_at"?: string,"evaluator"?: string,"experiment_id"?: string,"id"?: string,"owner_id"?: string,"score"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "sensory_evaluations_experiment_id_fkey"
      columns: ["experiment_id"]
isOneToOne: false
      referencedRelation: "experiments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sensory_evaluations_experiment_id_fkey"
      columns: ["experiment_id"]
isOneToOne: false
      referencedRelation: "v_experiment_summary"
      referencedColumns: ["experiment_id"]
    }
                  ]
                },"sources": {
                  Row: {
                    "accessed_on": string | null,"citation": string | null,"created_at": string,"id": string,"kind": string,"notes": string | null,"owner_id": string,"project_id": string | null,"title": string,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accessed_on"?: string | null,"citation"?: string | null,"created_at"?: string,"id"?: string,"kind": string,"notes"?: string | null,"owner_id"?: string,"project_id"?: string | null,"title": string,"url"?: string | null
                  }
                  Update: {
                    "accessed_on"?: string | null,"citation"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"notes"?: string | null,"owner_id"?: string,"project_id"?: string | null,"title"?: string,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "sources_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "research_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sources_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "v_research_context"
      referencedColumns: ["project_id"]
    }
                  ]
                },"suppliers": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"location": string | null,"name": string,"notes": string | null,"owner_id": string,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"location"?: string | null,"name": string,"notes"?: string | null,"owner_id"?: string,"url"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"location"?: string | null,"name"?: string,"notes"?: string | null,"owner_id"?: string,"url"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "v_experiment_sensory": {
                  Row: {
                    "attribute": string,"avg_score": number | null,"evaluations": number | null,"experiment_id": string,"max_score": number | null,"min_score": number | null,"stddev_score": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "sensory_evaluations_experiment_id_fkey"
      columns: ["experiment_id"]
isOneToOne: false
      referencedRelation: "experiments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sensory_evaluations_experiment_id_fkey"
      columns: ["experiment_id"]
isOneToOne: false
      referencedRelation: "v_experiment_summary"
      referencedColumns: ["experiment_id"]
    }
                  ]
                },"v_experiment_summary": {
                  Row: {
                    "baseline_experiment_id": string | null,"code": string,"conditions": string | null,"cost_per_serving": number | null,"evaluations": number | null,"experiment_id": string,"formulation_id": string,"hypothesis_id": string | null,"ingredients_without_price": number | null,"observations": string | null,"overall_score": number | null,"performed_on": string | null,"project_id": string,"servings": number | null,"status": string,"total_cost": number | null,"version": number
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "experiments_baseline_experiment_id_fkey"
      columns: ["baseline_experiment_id"]
isOneToOne: false
      referencedRelation: "experiments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experiments_baseline_experiment_id_fkey"
      columns: ["baseline_experiment_id"]
isOneToOne: false
      referencedRelation: "v_experiment_summary"
      referencedColumns: ["experiment_id"]
    },{
      foreignKeyName: "experiments_formulation_id_fkey"
      columns: ["formulation_id"]
isOneToOne: false
      referencedRelation: "formulations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experiments_formulation_id_fkey"
      columns: ["formulation_id"]
isOneToOne: false
      referencedRelation: "v_formulation_cost"
      referencedColumns: ["formulation_id"]
    },{
      foreignKeyName: "experiments_formulation_id_fkey"
      columns: ["formulation_id"]
isOneToOne: false
      referencedRelation: "v_formulation_nutrition"
      referencedColumns: ["formulation_id"]
    },{
      foreignKeyName: "experiments_formulation_id_fkey"
      columns: ["formulation_id"]
isOneToOne: false
      referencedRelation: "v_sensory_comparison"
      referencedColumns: ["formulation_id"]
    },{
      foreignKeyName: "experiments_hypothesis_id_fkey"
      columns: ["hypothesis_id"]
isOneToOne: false
      referencedRelation: "hypotheses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "formulations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "research_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "formulations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "v_research_context"
      referencedColumns: ["project_id"]
    }
                  ]
                },"v_formulation_cost": {
                  Row: {
                    "code": string,"cost_per_serving": number | null,"formulation_id": string,"ingredients_without_price": number | null,"project_id": string,"servings": number | null,"total_cost": number | null,"version": number
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "formulations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "research_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "formulations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "v_research_context"
      referencedColumns: ["project_id"]
    }
                  ]
                },"v_formulation_nutrition": {
                  Row: {
                    "carbohydrates_g": number | null,"code": string,"energy_kcal": number | null,"fat_g": number | null,"fiber_g": number | null,"formulation_id": string,"ingredients_without_nutrition": number | null,"project_id": string,"protein_g": number | null,"saturated_fat_g": number | null,"servings": number | null,"sodium_mg": number | null,"sugars_g": number | null,"version": number
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "formulations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "research_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "formulations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "v_research_context"
      referencedColumns: ["project_id"]
    }
                  ]
                },"v_price_history": {
                  Row: {
                    "brand": string | null,"created_at": string,"currency": string,"in_stock": boolean | null,"observed_on": string,"package_size": number,"price": number,"price_id": string,"product": string,"product_id": string,"supplier": string | null,"unit": string,"unit_cost": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "product_prices_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"v_product_unit_cost": {
                  Row: {
                    "brand": string | null,"created_at": string,"currency": string,"in_stock": boolean | null,"observed_on": string,"package_size": number,"price": number,"price_id": string,"product": string,"product_id": string,"supplier": string | null,"unit": string,"unit_cost": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "product_prices_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"v_research_context": {
                  Row: {
                    "context": Json | null,"project_id": string
                  }
                  ComputedFields: never
                  Insert: {
                           "context"?: never,"project_id"?: string | null
                         }
                        Update: {
                           "context"?: never,"project_id"?: string | null
                         }
                        Relationships: [
                    
                  ]
                },"v_sensory_comparison": {
                  Row: {
                    "attribute": string,"avg_score": number | null,"code": string,"evaluations": number | null,"formulation_id": string,"project_id": string,"version": number
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "formulations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "research_projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "formulations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "v_research_context"
      referencedColumns: ["project_id"]
    }
                  ]
                }
          }
          Functions: {
            "add_product_price":
{ Args: { "p_in_stock"?: boolean,"p_notes"?: string,"p_observed_on": string,"p_price": number,"p_product_id": string,"p_source_url"?: string,"p_supplier"?: string }; Returns: string
                           },
"create_formulation_version":
{ Args: { "source_formulation_id": string }; Returns: string
                           },
"keepalive":
{ Args: Record<PropertyKey, never>; Returns: number
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
