# #' 3D scatter plot on Rstudio viewer
# #'
# #' @export
# #' @examples
# #' library(ggplot2)
# #' data(ret)
# #' qplot3(aes(x=x, y=y, z=z, color=group), data=ret)
# qplot3 <- function(mapping, data, verbose_level=0) {
#   # TODO: mapping sanity check
# 
#   folder_name <- 'js16'
#   temp_dir <- tempdir()
#   if (verbose_level > 1) message(sprintf('Creating directory %s', temp_dir))
# 
#   if (!file.exists(file.path(temp_dir, folder_name))) {
#     plotter_dir <- system.file('zp', package='zp')
#     file.copy(plotter_dir, temp_dir, recursive=T)
#     file.rename(file.path(temp_dir, 'zp'), file.path(temp_dir, folder_name))
#     if (verbose_level > 1) message(sprintf('Copy %s to %s', plotter_dir, temp_dir))
#   }
# 
#   json_string <- jsonlite::toJSON(list(data=data, mapping=lapply(mapping, as.character)),
#                                   dataframe='columns', auto_unbox=T)
# 
#   write(json_string, file.path(temp_dir, folder_name, 'query.json'));
# 
#   rstudioapi::viewer(paste0(file.path(temp_dir, folder_name, 'index.html')))
# }

#' ZP
#'
#' @import htmlwidgets
#' @export
#' @examples
#' data(patients)
#' zp(patients, list(x='pc1', y='pc2', z='pc3', color='patient'))
#' zp(patients, list(x='mds1', y='mds2', z='mds3', color='patient'))
zp <-
  function(data_, mapping_) {
    message('R function `zp` is called!')

    msg <- list()
    msg$data <- data_
    msg$mapping <- mapping_

    sizing_policy <- sizingPolicy(viewer.padding=0)

    createWidget('zp', msg, sizingPolicy=sizing_policy)
  }
