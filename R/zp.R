# TODO: new API:
#
#                  zp(df) %>%
#                    zp_coord(pc1, pc2, pc3) %>%
#                    zp_coord(mds1, mds2, mds3) %>%
#                    zp_color(group) %>%
#                    zp_color(expr)
# 


#' Aesthetic object for ZP
#'
#' @import pryr
#' @export
zpa <- function(...) {
  output <- lapply(named_dots(...), as.character)
  class(output) <- 'zpa'
  output
}

#' ZP
#'
#' @import htmlwidgets
#' @export
#' @examples
#' data(patients)
#' data(MGH30genes)
#'
#' zp(patients, list(PCA=zpa(x=pc1, y=pc2, z=pc3, color=patient),
#'                   MDS=zpa(x=mds1, y=mds2, z=mds3, color=patient),
#'                   MDS_expr=zpa(x=mds1, y=mds2, z=mds3, color=highly_expressed),
#'                   PCA_expr=zpa(x=pc1, y=pc2, z=pc3, color=highly_expressed)))
#'
#' zp(MGH30genes, list(Correlation_tSNE=zpa(x=tsne1, y=tsne2, z=tsne3, color=pathway)))
zp <-
  function(data_, mappings_, use_viewer_=T) {
    msg <- list()
    msg$data <- data_
    
    if (class(mappings_) == 'zpa') {
      msg$mappings <- list('unnamed_mapping'=mappings_)
    } else if (class(mappings_) == 'list') {
      if (is.na(names(mappings_))) {
        stop('Error: no names found in mappings_.')
      } else {
        msg$mappings <- mappings_
      }
    } else {
      stop(sprintf('Error: mappings_ has unrecognized class %s.', class(mappings_)))
    }

    sizing_policy <- sizingPolicy(padding=0, browser.fill=T, viewer.suppress=!use_viewer_)

    createWidget('zp', msg, sizingPolicy=sizing_policy)
  }
